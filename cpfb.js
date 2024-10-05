const gl = require("gl")(800, 600); // Create a WebGL context with a window size of 800x600

// Vertex shader source code
const vertexShaderSource = `
  attribute vec4 position;
  void main() {
    gl_Position = position;
  }
`;

// Fragment shader source code
const fragmentShaderSource = `
  void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Set the color to red
  }
`;

// Compile a shader
function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Error compiling shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

// Create a program
function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
  const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(
    gl,
    fragmentShaderSource,
    gl.FRAGMENT_SHADER,
  );

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Error linking program:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

// Initialize shaders and program
const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

// Define triangle vertices (x, y, z, w)
const vertices = new Float32Array([
  0.0,
  1.0,
  0.0,
  1.0, // Vertex 1
  -1.0,
  -1.0,
  0.0,
  1.0, // Vertex 2
  1.0,
  -1.0,
  0.0,
  1.0, // Vertex 3
]);

// Create a buffer and put the vertices in it
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// Use the program
gl.useProgram(program);

// Bind the vertex buffer
const positionAttributeLocation = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(positionAttributeLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.vertexAttribPointer(positionAttributeLocation, 4, gl.FLOAT, false, 0, 0);

// Clear the screen
gl.clearColor(0.0, 0.0, 0.0, 1.0); // Black background
gl.clear(gl.COLOR_BUFFER_BIT);

// Draw the triangle
gl.drawArrays(gl.TRIANGLES, 0, 3);

// Output the result as an image
const pixels = Buffer.alloc(800 * 600 * 4); // RGBA buffer
gl.readPixels(0, 0, 800, 600, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

// Save the output image to a file (optional)
const fs = require("fs");
fs.writeFileSync("output.png", pixels);

console.log("Triangle rendered to output.png");
