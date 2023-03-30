uniform sampler2D tImage;
uniform vec2 uUvScale;
varying vec2 vUv;
varying vec2 vScreenUv;

void main() {
  vec4 tex;

  if (gl_FrontFacing) {
    vec2 uv = (vScreenUv - 0.5) * uUvScale + 0.5;
    tex = texture2D(tImage, uv);
  } else {
    tex = texture2D(tImage, vUv);
    tex.rgb = vec3((tex.r + tex.g + tex.b) / 3.0);
    tex.rgb *= 0.3;
  }

  gl_FragColor = tex;
}