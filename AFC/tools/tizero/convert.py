#!/usr/bin/env python3
"""Convert TiZero's PyTorch policy (submission/tizero/actor.pt, Apache-2.0, github.com/OpenRL-Lab/TiZero) into the flat
weight file AFC's native engine reads (assets/tizero.bin) - without PyTorch: a .pt file is a zip holding a pickle
plus raw tensor storages, so the pickle is read with stand-in classes and the storages with numpy.

  python3 tools/tizero/convert.py <TiZero>/submission/tizero/actor.pt assets/tizero.bin

File layout (little endian): b"TZ01", uint32 tensor count, then per tensor in ORDER: uint32 element count followed by
that many float16 values. The order and shapes are fixed by native/src/tizero.cpp.
"""
import pickle
import struct
import sys
import zipfile

import numpy as np

DTYPES = {'FloatStorage': np.float32, 'HalfStorage': np.float16, 'LongStorage': np.int64}

# (state_dict key, shape) in the order native/src/tizero.cpp reads them
def fc(prefix, n_in, n_out, seq):
    """an FcEncoder / get_fc block: Linear(n_in, n_out), ReLU, LayerNorm(n_out)"""
    return [(f'{prefix}{seq}.0.weight', (n_out, n_in)), (f'{prefix}{seq}.0.bias', (n_out,)),
            (f'{prefix}{seq}.2.weight', (n_out,)), (f'{prefix}{seq}.2.bias', (n_out,))]


def encoder(prefix, n_in, n_out):
    return fc(prefix, n_in, n_out, 'first_mlp') + fc(prefix, n_out, n_out, 'mlp.0')


ORDER = (
    encoder('obs_encoder.input_encoder.active_encoder.', 87, 64)
    + encoder('obs_encoder.input_encoder.ball_owner_encoder.', 57, 64)
    + encoder('obs_encoder.input_encoder.left_encoder.', 88, 64)
    + encoder('obs_encoder.input_encoder.right_encoder.', 88, 64)
    + encoder('obs_encoder.input_encoder.match_state_encoder.', 9, 9)
    + fc('obs_encoder.input_embedding', 265, 256, '')
    + [('obs_encoder.rnn.rnn.weight_ih_l0', (1024, 256)), ('obs_encoder.rnn.rnn.weight_hh_l0', (1024, 256)),
       ('obs_encoder.rnn.rnn.bias_ih_l0', (1024,)), ('obs_encoder.rnn.rnn.bias_hh_l0', (1024,)),
       ('obs_encoder.rnn.norm.weight', (256,)), ('obs_encoder.rnn.norm.bias', (256,))]
    + fc('obs_encoder.after_rnn_mlp', 256, 256, '')
    + fc('id_embedding', 11, 11, '')
    + encoder('before_act_wrapper.', 267, 256)
    + [('act.action_out.linear.weight', (20, 256)), ('act.action_out.linear.bias', (20,))]
)


def _fix(order):
    # get_fc blocks are nn.Sequential at the top level: '<name>.0.weight' (no extra dot segment)
    out = []
    for k, s in order:
        out.append((k.replace('..', '.'), s))
    return out


ORDER = _fix(ORDER)


class _Storage:
    def __init__(self, kind, key):
        self.kind, self.key = kind, key


def load(path):
    z = zipfile.ZipFile(path)
    root = z.namelist()[0].split('/')[0]
    storages = {}

    def get_storage(kind, key):
        if key not in storages:
            storages[key] = np.frombuffer(z.read(f'{root}/data/{key}'), dtype=DTYPES[kind])
        return storages[key]

    def rebuild_tensor_v2(storage, offset, size, stride, *rest):
        arr = get_storage(storage.kind, storage.key)
        if not size:
            return arr[offset:offset + 1].reshape(())
        n = 1
        for s in size:
            n *= s
        # contiguous tensors only (true for a saved state_dict)
        return np.lib.stride_tricks.as_strided(arr[offset:], shape=size,
                                               strides=[s * arr.itemsize for s in stride]).copy()

    class Unpickler(pickle.Unpickler):
        def find_class(self, module, name):
            if name == '_rebuild_tensor_v2':
                return rebuild_tensor_v2
            if name == 'OrderedDict':
                import collections
                return collections.OrderedDict
            if name.endswith('Storage'):
                return name
            if module.startswith('torch'):
                return lambda *a, **k: None
            return super().find_class(module, name)

        def persistent_load(self, pid):
            # ('storage', storage_type, key, location, numel)
            kind = pid[1] if isinstance(pid[1], str) else getattr(pid[1], '__name__', str(pid[1]))
            return _Storage(kind, pid[2])

    return Unpickler(z.open(f'{root}/data.pkl')).load()


def main(src, dst):
    sd = load(src)
    keys = [k for k, _ in ORDER]
    missing = [k for k in keys if k not in sd]
    unused = [k for k in sd if k not in keys]
    if missing:
        raise SystemExit('missing: %s\nhave: %s' % (missing, list(sd)))
    out = bytearray(b'TZ01' + struct.pack('<I', len(ORDER)))
    total = 0
    for k, shape in ORDER:
        a = np.asarray(sd[k], dtype=np.float32)
        if a.shape != shape:
            raise SystemExit('%s: shape %s, expected %s' % (k, a.shape, shape))
        out += struct.pack('<I', a.size) + a.astype('<f2').tobytes()
        total += a.size
    open(dst, 'wb').write(out)
    print('%s: %d tensors, %d parameters, %d bytes; not used (training only): %s' % (dst, len(ORDER), total, len(out), unused))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
