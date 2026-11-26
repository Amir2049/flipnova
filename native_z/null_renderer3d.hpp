// Null renderer for zocram4cc's engine on the phone: every Renderer3D call does nothing; Godot draws (as Google's MockRenderer3D)
#pragma once
#include "systems/graphics/rendering/interface_renderer3d.hpp"
namespace blunted {
class NullRenderer3D : public Renderer3D {
 public:
  void SwapBuffers() override {}
  void SetMatrix(const std::string& shaderUniformName, const Matrix4& matrix) override {}
  void RenderOverlay2D(const std::vector<Overlay2DQueueEntry>& overlay2DQueue) override {}
  void RenderOverlay2D() override {}
  void RenderLights(std::deque<LightQueueEntry>& lightQueue, const Matrix4& projectionMatrix, const Matrix4& viewMatrix) override {}
  bool CreateContext(int width, int height, int bpp, bool fullscreen) override { return true; }
  void Exit() override {}
  int CreateView(float x_percent, float y_percent, float width_percent, float height_percent) override { return 0; }
  View& GetView(int viewID) override { static View v; return v; }
  void DeleteView(int viewID) override {}
  void SetCullingMode(e_CullingMode cullingMode) override {}
  void SetBlendingMode(e_BlendingMode blendingMode) override {}
  void SetDepthFunction(e_DepthFunction depthFunction) override {}
  void SetDepthTesting(bool OnOff) override {}
  void SetDepthMask(bool OnOff) override {}
  void SetBlendingFunction(e_BlendingFunction blendingFunction1, e_BlendingFunction blendingFunction2) override {}
  void SetTextureMode(e_TextureMode textureMode) override {}
  void SetColor(const Vector3& color, float alpha) override {}
  void SetColorMask(bool r, bool g, bool b, bool alpha) override {}
  void ClearBuffer(const Vector3& color, bool clearDepth, bool clearColor) override {}
  Matrix4 CreatePerspectiveMatrix(float aspectRatio, float nearCap, float farCap) override { return Matrix4(); }
  Matrix4 CreateOrthoMatrix(float left, float right, float bottom, float top, float nearCap, float farCap) override { return Matrix4(); }
  VertexBufferID CreateVertexBuffer(float* vertices, unsigned int verticesDataSize, const std::vector<unsigned int>& indices, e_VertexBufferUsage usage) override { return VertexBufferID(); }
  void UpdateVertexBuffer(VertexBufferID vertexBufferID, float* vertices, unsigned int verticesDataSize, int dynamicFloats) override {}
  void DeleteVertexBuffer(VertexBufferID vertexBufferID) override {}
  void RenderVertexBuffer(const std::deque<VertexBufferQueueEntry>& vertexBufferQueue, e_RenderMode renderMode) override {}
  void RenderAABB(std::list<VertexBufferQueueEntry>& vertexBufferQueue) override {}
  void RenderAABB(std::list<LightQueueEntry>& lightQueue) override {}
  void SetLight(const Vector3& position, const Vector3& color, float radius) override {}
  int CreateTexture(e_InternalPixelFormat internalPixelFormat, e_PixelFormat pixelFormat, int width, int height, bool alpha, bool repeat, bool mipmaps, bool filter, bool multisample, bool compareDepth) override { return 0; }
  void ResizeTexture(int textureID, SDL_Surface* source, e_InternalPixelFormat internalPixelFormat, e_PixelFormat pixelFormat, bool alpha, bool mipmaps) override {}
  void UpdateTexture(int textureID, SDL_Surface* source, bool alpha, bool mipmaps) override {}
  void DeleteTexture(int textureID) override {}
  void CopyFrameBufferToTexture(int textureID, int width, int height) override {}
  void BindTexture(int textureID) override {}
  void SetTextureUnit(int textureUnit) override {}
  void SetClientTextureUnit(int textureUnit) override {}
  int CreateFrameBuffer() override { return 0; }
  void DeleteFrameBuffer(int fbID) override {}
  void BindFrameBuffer(int fbID) override {}
  void SetFrameBufferRenderBuffer(e_TargetAttachment targetAttachment, int rbID) override {}
  void SetFrameBufferTexture2D(e_TargetAttachment targetAttachment, int texID) override {}
  bool CheckFrameBufferStatus() override { return true; }
  void SetFramebufferGammaCorrection(bool onOff) override {}
  int CreateRenderBuffer() override { return 0; }
  void DeleteRenderBuffer(int rbID) override {}
  void BindRenderBuffer(int rbID) override {}
  void SetRenderBufferStorage(e_InternalPixelFormat internalPixelFormat, int width, int height) override {}
  void SetRenderTargets(const std::vector<e_TargetAttachment>& targetAttachments) override {}
  void SetFOV(float angle) override {}
  void PushAttribute(int attr) override {}
  void PopAttribute() override {}
  void SetViewport(int x, int y, int width, int height) override {}
  void GetContextSize(int& width, int& height, int& bpp) override {}
  void SetPolygonOffset(float scale, float bias) override {}
  void LoadShader(const std::string& name, const std::string& filename) override {}
  void UseShader(const std::string& name) override {}
  void SetUniformInt(const std::string& shaderName, const std::string& varName, int value) override {}
  void SetUniformFloat(const std::string& shaderName, const std::string& varName, float value) override {}
  void SetUniformFloat2(const std::string& shaderName, const std::string& varName, float value1, float value2) override {}
  void SetUniformFloat3(const std::string& shaderName, const std::string& varName, float value1, float value2, float value3) override {}
  void SetUniformFloat4Array(const std::string& shaderName, const std::string& varName, int count, float* values) override {}
  void SetUniformFloat3Array(const std::string& shaderName, const std::string& varName, int count, float* values) override {}
  void SetUniformMatrix4(const std::string& shaderName, const std::string& varName, const Matrix4& mat) override {}
  void HDRCaptureOverallBrightness() override {}
  float HDRGetOverallBrightness() override { return 0; }
  void operator()() override {}
};
}  // namespace blunted
