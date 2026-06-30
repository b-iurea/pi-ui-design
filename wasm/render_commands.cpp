#include "render_commands.h"
#include <algorithm>

namespace uidesign {

void CommandList::addRect(float x, float y, float w, float h,
                          uint8_t r, uint8_t g, uint8_t b, uint8_t a,
                          float radius, float opacity) {
  if (commands_.size() >= MAX_COMMANDS) return;
  DrawCommand cmd;
  cmd.type = radius > 0.5f ? DrawType::ROUNDED_RECT : DrawType::RECT;
  cmd.x = x; cmd.y = y; cmd.w = w; cmd.h = h;
  cmd.r = r; cmd.g = g; cmd.b = b; cmd.a = a;
  cmd.radius = radius;
  cmd.opacity = opacity;
  commands_.push_back(cmd);
}

void CommandList::addText(float x, float y, const char* text,
                          uint8_t r, uint8_t g, uint8_t b, uint8_t a,
                          float /*fontSize*/) {
  if (commands_.size() >= MAX_COMMANDS) return;
  DrawCommand cmd;
  cmd.type = DrawType::TEXT;
  cmd.x = x; cmd.y = y;
  cmd.r = r; cmd.g = g; cmd.b = b; cmd.a = a;
  cmd.opacity = 1.0f;
  std::strncpy(cmd.text, text, sizeof(cmd.text) - 1);
  commands_.push_back(cmd);
}

void CommandList::addEllipse(float x, float y, float w, float h,
                             uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
  if (commands_.size() >= MAX_COMMANDS) return;
  DrawCommand cmd;
  cmd.type = DrawType::ELLIPSE;
  cmd.x = x; cmd.y = y; cmd.w = w; cmd.h = h;
  cmd.r = r; cmd.g = g; cmd.b = b; cmd.a = a;
  commands_.push_back(cmd);
}

void CommandList::addLine(float x1, float y1, float x2, float y2,
                          uint8_t r, uint8_t g, uint8_t b, uint8_t a,
                          float strokeWidth) {
  if (commands_.size() >= MAX_COMMANDS) return;
  DrawCommand cmd;
  cmd.type = DrawType::LINE;
  cmd.x = x1; cmd.y = y1; cmd.w = x2; cmd.h = y2;
  cmd.r = r; cmd.g = g; cmd.b = b; cmd.a = a;
  cmd.strokeWidth = strokeWidth;
  commands_.push_back(cmd);
}

void CommandList::addImage(float x, float y, float w, float h, uint32_t imageId) {
  if (commands_.size() >= MAX_COMMANDS) return;
  DrawCommand cmd;
  cmd.type = DrawType::IMAGE;
  cmd.x = x; cmd.y = y; cmd.w = w; cmd.h = h;
  cmd.imageId = imageId;
  commands_.push_back(cmd);
}

} // namespace uidesign
