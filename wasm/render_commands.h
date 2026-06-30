#ifndef UI_DESIGN_RENDER_COMMANDS_H
#define UI_DESIGN_RENDER_COMMANDS_H

#include <vector>
#include <cstdint>
#include <cstring>

namespace uidesign {

/* ─── Draw command types ─── */
enum class DrawType : uint8_t {
  RECT = 0,
  ROUNDED_RECT,
  ELLIPSE,
  LINE,
  TEXT,
  IMAGE,
  PATH,
  GROUP_BEGIN,
  GROUP_END,
};

/* ─── A single draw command ─── */
struct DrawCommand {
  DrawType type;
  float x, y, w, h;
  uint8_t r, g, b, a;           // fill color
  uint8_t strokeR, strokeG, strokeB, strokeA;
  float strokeWidth = 0;
  float radius = 0;             // corner radius
  float rotation = 0;
  char text[128] = {0};         // text content
  uint32_t imageId = 0;         // texture handle
  float opacity = 1.0f;
};

/* ─── Command list builder ─── */
class CommandList {
public:
  CommandList() = default;

  void clear() { commands_.clear(); }
  size_t size() const { return commands_.size(); }
  const DrawCommand* data() const { return commands_.data(); }

  void addRect(float x, float y, float w, float h,
               uint8_t r, uint8_t g, uint8_t b, uint8_t a,
               float radius = 0, float opacity = 1.0f);

  void addText(float x, float y, const char* text,
               uint8_t r, uint8_t g, uint8_t b, uint8_t a,
               float fontSize = 14.0f);

  void addEllipse(float x, float y, float w, float h,
                  uint8_t r, uint8_t g, uint8_t b, uint8_t a);

  void addLine(float x1, float y1, float x2, float y2,
               uint8_t r, uint8_t g, uint8_t b, uint8_t a,
               float strokeWidth = 1.0f);

  void addImage(float x, float y, float w, float h, uint32_t imageId);

  const std::vector<DrawCommand>& commands() const { return commands_; }

private:
  std::vector<DrawCommand> commands_;
  static constexpr size_t MAX_COMMANDS = 50000;
};

} // namespace uidesign

#endif
