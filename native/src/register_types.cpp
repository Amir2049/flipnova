#include <gdextension_interface.h>

#include <godot_cpp/core/class_db.hpp>
#include <godot_cpp/core/defs.hpp>
#include <godot_cpp/godot.hpp>

#include "gf_engine.h"

using namespace godot;

static void initialize_afcgf(ModuleInitializationLevel level) {
  if (level != MODULE_INITIALIZATION_LEVEL_SCENE) return;
  GDREGISTER_CLASS(GFEngine);
}

static void uninitialize_afcgf(ModuleInitializationLevel level) {}

extern "C" {
GDExtensionBool GDE_EXPORT afcgf_library_init(GDExtensionInterfaceGetProcAddress get_proc_address,
                                             const GDExtensionClassLibraryPtr library,
                                             GDExtensionInitialization* r_initialization) {
  GDExtensionBinding::InitObject init_obj(get_proc_address, library, r_initialization);
  init_obj.register_initializer(initialize_afcgf);
  init_obj.register_terminator(uninitialize_afcgf);
  init_obj.set_minimum_library_initialization_level(MODULE_INITIALIZATION_LEVEL_SCENE);
  return init_obj.init();
}
}
