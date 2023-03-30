uniform float uRadius;
uniform float uSpeed;
varying vec2 vUv;
varying vec2 vScreenUv;

void main() {
  vUv = uv;

  vec3 pos = position;
  float d = 1.0 - smoothstep(0.0, 1.0, abs(pos.y));
  pos.x += uSpeed * d * 0.5;

  vec4 worldPos = modelMatrix * vec4( pos, 1.0 );
  worldPos.xz = normalize(worldPos.xz) * uRadius;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
  // gl_Position = vec4( position * vec3(2.0 / 1.3, 2.0, 1.0), 1.0 );
  vScreenUv = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
}