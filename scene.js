/*
*Assignment 6
*Csci 566 Fall 2016
*@author: Jon Allen
*Hosted at: http://www.ecst.csuchico.edu/~jallen59/566/p6/scene.html
* 
*Rendera  scene to show the usage of lighting
*W: Move Forward
*S: Move back
*A: look right
*D: look left
*Q: Toggle Red Light
*E: Toggle Blue Light
*/

/**
 *Shader Programs
 *One set for texture
 *One set for solids
*/
var TEX_VSHADER_SOURCE =
'attribute vec4 a_Position;\n' +
'attribute vec2 a_TexCoord;\n' +
'uniform mat4 u_MvpMatrix;\n' +
'varying vec2 v_TexCoord;\n' +
'void main() {\n' +
'  gl_Position = u_MvpMatrix * a_Position;\n' +
'  v_TexCoord = a_TexCoord;\n' +
'}\n';

var TEX_FSHADER_SOURCE =
'#ifdef GL_ES\n' +
'precision mediump float;\n' +
'#endif\n' +
'uniform sampler2D u_Sampler;\n' +
'varying vec2 v_TexCoord;\n' +
'void main() {\n' +
'  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
'}\n';

/**
 *Shader for Solid(non-textured) objects
 *Uses two point lights, a single directional
 *light and ambient light.
 */
var SOL_VSHADER_SOURCE =
'attribute vec4 a_Position;\n' +
'uniform vec4 a_Color;\n' +          
'attribute vec4 a_Normal;\n' +       
'uniform mat4 u_MvpMatrix;\n' +
'uniform vec3 u_DiffuseLight;\n' +   
'uniform vec3 u_LightDirection;\n' + 
'uniform vec3 u_AmbientLight;\n' +   
'uniform vec3 u_DirectOneColor;\n' + 
'uniform mat4 u_ModelMatrix;\n' +
'uniform mat4 u_NormalMatrix;\n' +
'uniform vec3 u_DirectOnePosition;\n' +
'uniform vec3 u_DirectTwoColor;\n' +
'uniform vec3 u_DirectTwoPosition;\n' +
'varying vec4 v_Color;\n' +
'void main() {\n' +
'  gl_Position = u_MvpMatrix * a_Position;\n' +
   // Make the length of the normal 1.0
'  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    // Calculate world coordinate of vertex
'  vec4 vertexPosition = u_ModelMatrix * a_Position;\n' +
    // Calculate the light direction and make it 1.0 in length
'  vec3 oneDirection = normalize(u_DirectOnePosition - vec3(vertexPosition));\n' +
    // The dot product of the light direction and the normal
'  float DotDirectOne = max(dot(oneDirection, normal), 0.0);\n' +
    // Calculate the color due to diffuse reflection
'  vec3 one = u_DirectOneColor * a_Color.rgb * DotDirectOne;\n' +
    // Calculate the light direction and make it 1.0 in length
'  vec3 twoDirection = normalize(u_DirectTwoPosition - vec3(vertexPosition));\n' +
    // The dot product of the light direction and the normal
'  float DotDirectTwo = max(dot(twoDirection, normal), 0.0);\n' +
    // Calculate the color due to diffuse reflection
'  vec3 two = u_DirectTwoColor * a_Color.rgb * DotDirectTwo;\n' +
   // The dot product of the light direction and the normal (the orientation of a surface)
'  float DotDiffuse = max(dot(u_LightDirection, normal), 0.0);\n' +
   // Calculate the color due to diffuse reflection
'  vec3 diffuse = u_DiffuseLight * a_Color.rgb * DotDiffuse;\n' +
   // Calculate the color due to ambient reflection
'  vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
   // Add the surface colors due to diffuse reflection and ambient reflection
'  v_Color = vec4(one + two + diffuse + ambient, a_Color.a);\n' + 
'}\n';

// Fragment shader program
var SOL_FSHADER_SOURCE =
'#ifdef GL_ES\n' +
'precision mediump float;\n' +
'#endif\n' +
'varying vec4 v_Color;\n' +
'void main() {\n' +
'  gl_FragColor = v_Color;\n' +
'}\n';

/*Global variables for 
 *view and light toggling
 */
var g_eyeX = 0, g_eyeY = 0, g_eyeZ = 15;
var theta = 0, AtX = 0, AtZ = 14;
var lightOne = 1;
var lightTwo = 1;

/*Main function for
 *setting up program and 
 *animating
 */
function main() {

    //Matrixes for view
    var mats = {
        modelMatrix: new Matrix4(),
        viewMatrix: new Matrix4(),
        projMatrix: new Matrix4(),
        mvpMatrix: new Matrix4(),
        normalMatrix: new Matrix4()
    };
    
    mats.modelMatrix.rotate(45,0, 1, 0);
    mats.normalMatrix.setInverseOf(mats.modelMatrix);
    mats.normalMatrix.transpose();

    //Models for building
    var Builds = {
        one: { 
            mod: new Matrix4(),
            norm: new Matrix4()
        },
        two: {
            mod: new Matrix4(),
            norm: new Matrix4()
        },
        three: {
            mod: new Matrix4(),
            norm: new Matrix4()
        },
        six: {
            mod: new Matrix4(),
            norm: new Matrix4()
        },
    };
    
    var keys = [];

    //Set up the building models
    setBuilds(Builds);

    // get WebGL rendering context
    var canvas = document.getElementById('webgl');
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }   

    //set up texProgram
    var texProgram = createProgram(gl, TEX_VSHADER_SOURCE, TEX_FSHADER_SOURCE);
    texProgram.a_Position = gl.getAttribLocation(texProgram, 'a_Position');
    texProgram.a_TexCoord = gl.getAttribLocation(texProgram, 'a_TexCoord');
    texProgram.u_MvpMatrix = gl.getUniformLocation(texProgram, 'u_MvpMatrix');
    texProgram.u_Sampler = gl.getUniformLocation(texProgram, 'u_Sampler');
    

    //set up solidProgram
    var solidProgram = createProgram(gl, SOL_VSHADER_SOURCE, SOL_FSHADER_SOURCE);
    solidProgram.a_Position = gl.getAttribLocation(solidProgram, 'a_Position');
    solidProgram.a_Normal = gl.getAttribLocation(solidProgram, 'a_Normal');
    solidProgram.u_MvpMatrix = gl.getUniformLocation(solidProgram, 'u_MvpMatrix');
    solidProgram.a_Color = gl.getUniformLocation(solidProgram, 'a_Color');
    solidProgram.u_DiffuseLight = gl.getUniformLocation(solidProgram, 'u_DiffuseLight');
    solidProgram.u_LightDirection = gl.getUniformLocation(solidProgram, 'u_LightDirection');
    solidProgram.u_DirectOneColor = gl.getUniformLocation(solidProgram, 'u_DirectOneColor');
    solidProgram.u_DirectOnePosition = gl.getUniformLocation(solidProgram, 'u_DirectOnePosition');
    solidProgram.u_ModelMatrix = gl.getUniformLocation(solidProgram, 'u_ModelMatrix');
    solidProgram.u_NormalMatrix = gl.getUniformLocation(solidProgram, 'u_NormalMatrix');    
    solidProgram.u_AmbientLight = gl.getUniformLocation(solidProgram, 'u_AmbientLight');
    solidProgram.u_DirectTwoColor = gl.getUniformLocation(solidProgram, 'u_DirectTwoColor');
    solidProgram.u_DirectTwoPosition = gl.getUniformLocation(solidProgram, 'u_DirectTwoPosition');

    //Initialize the ground and cube buffers
    var Ground = initGBuffer(gl, texProgram);
    var Cube = initCBuffer(gl, solidProgram);
    var Sphere = initSphere(gl, solidProgram);

    //set up the vie matrixes
    mats.viewMatrix.setLookAt(g_eyeX, g_eyeY, g_eyeZ, AtX, 0, AtZ, 0, 1, 0);
    mats.projMatrix.setPerspective(90, canvas.width/canvas.height, 0.1, 200);
    // Calculate the model view projection matrix
    mats.mvpMatrix.set(mats.projMatrix).multiply(mats.viewMatrix).multiply(mats.modelMatrix);

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);     // Clear <canvas>

    // Set texture
    if (!initTextures(gl, Ground, texProgram, mats)) {
        console.log('Failed to intialize the texture.');
        return;
    }

    //Function to capture key presses
    document.onkeydown = function(ev){ 
        keydown(ev, keys); 
    };
    document.onkeyup = function(ev) {
        keyup(ev, keys);
    };

    //Animation loop
    var tick = function() {
        animate(Builds);
        move(keys);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        drawGround(gl, Ground, mats, texProgram);
        drawCubes(gl, Cube, mats, solidProgram, Builds);
        drawSphere(gl, Sphere, mats, solidProgram);
        requestAnimationFrame(tick);
    };
    tick();
}

//Used to convert from degrees to rads for cos and sin
function toRads (rads) {
    return rads * (Math.PI/180);
}
 
/**
 *Sets keys to 0 when key is released for movement
 *@param ev Browser environment
 *@param keys An array of key presses being tracked
 */
function keydown(ev, keys) {
    switch(ev.keyCode) {
        case 87: //W
            keys[0] = 1;
            break;
        case 83: //S
            keys[1] = 1;
            break;
        case 65: //A
            keys[2] = 1;
            break;
        case 68: //D
            keys[3] = 1;
            break;
        case 37: //Left
            keys[4] = 1;
            break;
        case 39: //Right
            keys[5] = 1;
            break;
        case 81:
            if(lightOne == 1) {
                lightOne = 0;
            } else {
                lightOne = 1;
            }
            break;
        case 69:
            if(lightTwo == 1) {
                lightTwo = 0;
            } else {
                lightTwo = 1;
            }
            break;
    }    
}

/**
 *Sets keys to 0 when key is released for movement
 *@param ev Browser environment
 *@param keys An array of key presses being tracked
 */
function keyup(ev, keys) {
    switch(ev.keyCode) {
        case 87: //W
            keys[0] = 0;
            break;
        case 83: //S
            keys[1] = 0;
            break;
        case 65: //A
            keys[2] = 0;
            break;
        case 68: //D
            keys[3] = 0;
            break;
        case 37: //Left
            keys[4] = 0;
            break;
        case 39: //Right
            keys[5] = 0;
            break;
    }     
}

/**
 *Moves the views based on keys that have been pressed
 *@param keys An array of key presses being tracked above
 */
function move(keys) {
    if (keys[0] === 1) { //W
        g_eyeZ = AtZ;
        g_eyeX = AtX;
        AtZ = g_eyeZ - Math.cos(toRads(theta));
        AtX = g_eyeX + Math.sin(toRads(theta));        
    }
    if (keys[1] === 1) { //S
        stepBack();        
    }
    if (keys[2] === 1) { //A
        rotateLeft();        
    }
    if (keys[3] === 1) { //D
        theta = (theta + 2)%360;
        AtZ = (g_eyeZ - Math.cos(toRads(theta)));
        AtX = (g_eyeX + Math.sin(toRads(theta)));        
    }
    if (keys[4] === 1) {
        rotateLeft();            
    }
    if (keys[5] === 1) {
        theta = (theta + 2)%360;
        AtZ = (g_eyeZ - Math.cos(toRads(theta)));
        AtX = (g_eyeX + Math.sin(toRads(theta)));    
    }
}

/**
 *function drawCubes() sets the view matrix
 *then draws all of the geometry that uses the 
 *solid program. Five buildings and the windmill
 *plus blades.
 *@param gl webgl context
 *@param Cube The cube object
 *@param mats An object full of needed matrices
 *@param program The current shader program being use
 *@param Builds The matrices for different cube objects to be built
*/
function drawCubes(gl, Cube, mats, program, Builds) {
    //set the program
    gl.useProgram(program);	
    
    //Set up the lights
    gl.uniform3f(program.u_DiffuseLight, 0.7, 0.7, 0.7);
    var lightDirection = new Vector3([1, 1, 1]);
    lightDirection.normalize();     // Normalize
    gl.uniform3fv(program.u_LightDirection, lightDirection.elements);
    gl.uniform3f(program.u_AmbientLight, 0.2, 0.2, 0.2);
    
    //directional light one
    gl.uniform3f(program.u_DirectOneColor, lightOne, 0, 0);
    gl.uniform3f(program.u_DirectOnePosition, -7, 0, 0);
    
    //directional light two
    gl.uniform3f(program.u_DirectTwoColor, 0, 0, lightTwo);
    gl.uniform3f(program.u_DirectTwoPosition, 7, 0, 0);
    
    //Update the viewMatrix
    mats.viewMatrix.setLookAt(g_eyeX, g_eyeY, g_eyeZ, AtX, 0, AtZ, 0, 1, 0);
    
    //enable position buffer    
    gl.bindBuffer(gl.ARRAY_BUFFER, program.a_posBuffer);
    gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Postion); 

    //enable normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, program.a_norBuffer);
    gl.vertexAttribPointer(program.a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Normal);
    
    //bind index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Cube.indexBuffer);   

    //Two for loops are used to draw the many cubes in the scene to make the ship
    for(var i = 0; i < 50; i++) {
        drawCube(gl, Builds.six.mod, Builds.six.norm, Cube, 'grey', mats, program);
        Builds.six.mod.rotate(3, 0, 1, 0);
        Builds.six.mod.translate(0, -3, 0);
    }    
    Builds.six.mod.translate(0, 150, 0);
    Builds.six.mod.rotate(45, 0, 1, 0);
        for(var i = 0; i < 50; i++) {
        drawCube(gl, Builds.six.mod, Builds.six.norm, Cube, 'grey', mats, program);
        Builds.six.mod.rotate(-3, 0, 1, 0);
        Builds.six.mod.translate(0, -3, 0);
    } 
    Builds.six.mod.translate(0, 150, 0);
    Builds.six.mod.rotate(-45, 0, 1, 0);
    
    //Draw the center column of the shit
    drawCube(gl, Builds.three.mod, Builds.three.norm, Cube, 'grey', mats, program);
	
    //set ambient light to max so the point light sources show up bright
    //then draw the two point light sources
    gl.uniform3f(program.u_AmbientLight, 1, 1, 1);
    drawCube(gl, Builds.one.mod, Builds.one.norm, Cube, 'red', mats, program);
    drawCube(gl, Builds.two.mod, Builds.two.norm, Cube, 'blue', mats, program);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

/**
* Draws and individual cube
* @param gl webgl context
* @param model The model matrix of the current object
* @param normal The normal matrix of the current object
* @param Cube The cube object
* @param mats An object full of needed matrices
* @param color The color to be applied to the current object
* @param program The current shader program being use
 */
function drawCube(gl, model, normal, Cube, color, mats, program) {
    //set up view, mode, and normals and pass them to the shader
    mats.mvpMatrix.set(mats.projMatrix).multiply(mats.viewMatrix).multiply(model);
    normal.setInverseOf(model);
    normal.transpose();
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, normal.elements);
    gl.uniformMatrix4fv(program.u_ModelMatrix, false, model.elements);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mats.mvpMatrix.elements);

    //set the color of the cube
    if(color === 'grey') {
        gl.uniform4f(program.a_Color, 0.8, 0.8, 0.8, 1);
    } else if (color === 'red') {
        gl.uniform4f(program.a_Color, 1, 0, 0, 1);
    } else if (color === 'blue') {
        gl.uniform4f(program.a_Color, 0, 0, 1, 1);
    }

    gl.drawElements(gl.TRIANGLES, Cube.indices.length, gl.UNSIGNED_BYTE, 0);   
}

/**
 *Draws the sphere at the center of the ship
 *@param gl WebGL context
 *@param Sphere The Sphere object being drawn
 *@param mats An object full of needed matrices
 *@param program The current shader program full of variable locations
 */
function drawSphere(gl, Sphere, mats, program) {
    
    //reset the ambient light from drawing the point light cubes
    gl.uniform3f(program.u_AmbientLight, 0.2, 0.2, 0.2);
    
    //enable position buffer    
    gl.bindBuffer(gl.ARRAY_BUFFER, Sphere.a_posBuffer);
    gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Postion);   

    //enable normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, Sphere.a_norBuffer);
    gl.vertexAttribPointer(program.a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Normal);  
    
    //set color
    gl.uniform4f(program.a_Color, 0.8, 0.8, 0.8, 1);

    //bind indice buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Sphere.indexBuffer);    
    
    //set up view, mode, and normals and pass them to the shader
    mats.mvpMatrix.set(mats.projMatrix).multiply(mats.viewMatrix).multiply(Sphere.model);
    Sphere.normal.setInverseOf(Sphere.model);
    Sphere.normal.transpose();
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, Sphere.normal.elements);
    gl.uniformMatrix4fv(program.u_ModelMatrix, false, Sphere.model.elements);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mats.mvpMatrix.elements);
    gl.drawElements(gl.TRIANGLES, Sphere.indices.length, gl.UNSIGNED_SHORT, 0);
}

/**
 *Draws the Ground(space) at the center of the ship
 *@param gl WebGL context
 *@param Ground The object being drawn
 *@param mats An object full of needed matrices
 *@param program The current shader program full of variable locations
 */
function drawGround(gl, Ground, mats, program) {
    //Use the texture program
    gl.useProgram(program);
    //
    mats.viewMatrix.setLookAt(g_eyeX, g_eyeY, g_eyeZ, AtX, 0, AtZ, 0, 1, 0);
    mats.mvpMatrix.set(mats.projMatrix).multiply(mats.viewMatrix).multiply(Ground.boxMatrix);
    // Pass the model view projection matrix to u_MvpMatrix
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mats.mvpMatrix.elements);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, Ground.vertexBuffer);
    gl.vertexAttribPointer(program.a_Position, Ground.vertexBuffer.num, Ground.vertexBuffer.type, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Position);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, Ground.texCoordBuffer);
    gl.vertexAttribPointer(program.a_TexCoord, Ground.texCoordBuffer.num, Ground.texCoordBuffer.type, false, 0, 0);
    gl.enableVertexAttribArray(program.a_TexCoord);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Ground.indexBuffer);
    gl.drawElements(gl.TRIANGLES, Ground.numIndices, Ground.indexBuffer.type, 0);  
}

/**
 *initTextures creates a new texture object and a new image object
 *then calls loadTexture to set it up in the shaders
 */
function initTextures(gl, Ground, program, mats) {
    // Create a texture object
    var texture = gl.createTexture();   
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    // Create the image object
    var image = new Image();  
    if (!image) {
        console.log('Failed to create the image object');
        return false;
    }
    // Register the event handler to be called on loading an image
    image.onload = function(){ loadTexture(gl, Ground, program, texture, image, mats); };
    // Tell the browser to load an image
    image.src = './space.jpg';

    return true;
}

/**
 *Loads the texture into the texProgram
 *and draws the ground after finishing setting it up
 */
function loadTexture(gl, Ground, program, texture, image, mats) {
    // Flip the image's y axis
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); 
    // Enable texture unit0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Set the texture unit 0 to the sampler
    gl.useProgram(program);
    gl.uniform1i(program.u_Sampler, 0);

    //draw the ground after the textures are loaded
    drawGround(gl, Ground, mats, program);
}

/**
 *Initializes the buffer for the ground.
 *@params gl WebGL context
 *@params program the current shader program
 *@return The cube object
 */
function initGBuffer(gl, program) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

    // Vertex coordinates
    var vertices = new Float32Array([
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
    ]);

    // Texture coordinates
    var texCoords = new Float32Array([
      1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
      0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
      1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
      1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
      0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
      0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
    ]);

    // Indices of the vertices
    var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
    ])

    var o = new Object();  // Create the "Object" object to return multiple objects.
    
    o.boxMatrix = new Matrix4();
    o.boxMatrix.scale(50,50,50);

    // Write vertex information to buffer object
    o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
    o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
    if (!o.vertexBuffer || !o.texCoordBuffer || !o.indexBuffer) return null; 

    o.numIndices = indices.length;

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}

/**
 *Initializes the buffers for the texture program
 *@param gl WebGL context
 *@param data The data to be placed in the buffer
 *@param num Used to save the buffer size
 *@param type Used to save the buffer type
 */
function initArrayBufferForLaterUse(gl, data, num, type) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // Store the necessary information to assign the object to the attribute variable later
    buffer.num = num;
    buffer.type = type;

    return buffer;
}

/**
 *Initializes the element array buffers for the texture program
 *@param gl WebGL context
 *@param data The data to be placed in the buffer
 *@param type Used to save the buffer type
 */
function initElementArrayBufferForLaterUse(gl, data, type) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    buffer.type = type;

    return buffer;
}

/**
 *Initializes the buffer for the cube object.
 *@params gl WebGL context
 *@params program the current shader program
 *@return The cube object
 */
function initCBuffer(gl, program) {
    //create an object and set up the coords for
    //vertices and texture
    gl.useProgram(program);
    var o = new Object();
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    // Coordinates
    o.vertices = new Float32Array([
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5 back
    ]);

    // Normal
    o.normals = new Float32Array([
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
    ]);

    // Indices of the vertices
    o.indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
    ]);

    o.n = 36;
    
    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', o.vertices, 3,program)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', o.normals, 3,program)) return -1;
   
    o.indexBuffer = gl.createBuffer();
    if (!o.indexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, o.indices, gl.STATIC_DRAW);
    //free the buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return o;
}

/**
 *Initializes the buffers for the solid program
 *seperate from init for the texture cube and for the sphere
 *@param gl WebGL context
 *@param attribute Used to save the type of attribute
 *@param data Data to be buffered
 *@param num Used for buffer stride size
 *@param program The shader program being used
 */
function initArrayBuffer(gl, attribute, data, num,program) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
    }
    
    if(attribute === 'a_Position') {
        program.a_posBuffer = buffer;
    } else {
        program.a_norBuffer = buffer;
    }

    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    gl.vertexAttribPointer(program.attribute, num, gl.FLOAT, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(program.attribute);

    return true;
}

/**
 *Initializes the buffer for the Sphere object.
 *@params gl WebGL context
 *@params program the current shader program
 *@return The Sphere object
 */
function initSphere(gl, program) { // Create a sphere

    var o = new Object();
    o.SPHERE_DIV = 13;

    var i, ai, si, ci;
    var j, aj, sj, cj;
    var p1, p2;

    o.positions = [];
    o.indices = [];

    // Generate coordinates
    for (j = 0; j <= o.SPHERE_DIV; j++) {
        aj = j * Math.PI / o.SPHERE_DIV;
        sj = Math.sin(aj);
        cj = Math.cos(aj);
        for (i = 0; i <= o.SPHERE_DIV; i++) {
            ai = i * 2 * Math.PI / o.SPHERE_DIV;
            si = Math.sin(ai);
            ci = Math.cos(ai);

            o.positions.push(si * sj);  // X
            o.positions.push(cj);       // Y
            o.positions.push(ci * sj);  // Z
        }
    }

    // Generate indices
    for (j = 0; j < o.SPHERE_DIV; j++) {
        for (i = 0; i < o.SPHERE_DIV; i++) {
            p1 = j * (o.SPHERE_DIV+1) + i;
            p2 = p1 + (o.SPHERE_DIV+1);

            o.indices.push(p1);
            o.indices.push(p2);
            o.indices.push(p1 + 1);

            o.indices.push(p1 + 1);
            o.indices.push(p2);
            o.indices.push(p2 + 1);
        }
    }

    // Write the vertex property to buffers (coordinates and normals)
    // Same data can be used for vertex and normal
    // In order to make it intelligible, another buffer is prepared separately
    if (!initArrayBufferSphere(gl, 'a_Position', new Float32Array(o.positions), gl.FLOAT, 3, o)) return -1;
    if (!initArrayBufferSphere(gl, 'a_Normal', new Float32Array(o.positions), gl.FLOAT, 3, o))  return -1;

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Write the indices to the buffer object
    o.indexBuffer = gl.createBuffer();
    if (!o.indexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(o.indices), gl.STATIC_DRAW);
    
    //sets up the translation matrix for the singe sphere in the scene
    o.model = new Matrix4();
    o.model.translate(0, 2, 0);
    o.model.scale(1.2,1.2,1.2);
    o.normal = new Matrix4();

    return o;
}

/**
 *Initializes the buffers for the solid program
 *seperate from init for the texture cube and for solid cube
 *@param gl WebGL context
 *@param attribute Used to save the type of attribute
 *@param data Data to be buffered
 *@param type Used for buffer type
 *@param num Used for buffer stride size
 *@param o Buffer is saved into object being passed in
 */
function initArrayBufferSphere(gl, attribute, data, type, num, o) {
  // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    
    if(attribute === 'a_Position') {
        o.a_posBuffer = buffer;
    } else if (attribute === 'a_Normal') {
        o.a_norBuffer = buffer;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    gl.vertexAttribPointer(o.attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(o.attribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return true;
}

/**
 *Likely no longer necessary, if/else statements were used during
 *experimenting and it works currently so I'm leaving it alone to 
 *not cause potential issues that I don't want to deal with.
 */
function rotateLeft() {
    if (theta == 0) {
        theta = 358;
    } else {
        theta = (theta -2);
    }
    if(AtZ < g_eyeZ && AtX > g_eyeX) {
        AtZ = (g_eyeZ - Math.cos(toRads(theta)));
        AtX = (g_eyeX + Math.sin(toRads(theta)));
    } else 
    if (AtZ < g_eyeZ && AtX <= g_eyeX) {
        AtZ = (g_eyeZ - Math.cos(toRads(theta)));
        AtX = (g_eyeX + Math.sin(toRads(theta)));		
    } else 
    if (AtZ >= g_eyeZ && AtX > g_eyeX) {
        AtZ = (g_eyeZ - Math.cos(toRads(theta)));
        AtX = (g_eyeX + Math.sin(toRads(theta)));		
    } else 
    if (AtZ >= g_eyeZ && AtX <= g_eyeX) {
        AtZ = (g_eyeZ - Math.cos(toRads(theta)));
        AtX = (g_eyeX + Math.sin(toRads(theta)));		
    } else {return;}	
}

/**
 *Handles moving backwards when the down key is pressed
 */
function stepBack() {
    //Find the direction of directly behind you
    stepZ = g_eyeZ - Math.cos(toRads((theta+180)%360));
    stepX = g_eyeX + Math.sin(toRads((theta+180)%360));
    //move to that spot behind you
    g_eyeZ = stepZ;
    g_eyeX = stepX;
    //move look at location to the correct spot
    AtZ = g_eyeZ - Math.cos(toRads(theta));
    AtX = g_eyeX + Math.sin(toRads(theta));	
}

/**
 *Sets up the translation matrices for the objects
 *@param Builds an object full of objects full of matrices
 */
function setBuilds(Builds) {

    /*Each block effects are from bottom to top.
     *First scale, then rotate,
     *finally translate to the correct location
     */
    Builds.one.mod.translate(-7,0,0);
    Builds.one.mod.rotate(45, 0, 1, 0);
    Builds.one.mod.rotate(34, 1, 0, 0);
    Builds.one.mod.scale(0.2, 0.2, 0.2);		
    
    Builds.two.mod.translate(7,0,0);
    Builds.two.mod.rotate(45, 0, 1, 0);
    Builds.two.mod.rotate(34, 1, 0, 0);    
    Builds.two.mod.scale(0.2, 0.2, 0.2);
    
    Builds.three.mod.scale(0.6, 7, 0.6);
    
    Builds.six.mod.translate(0, 7, 0);
    Builds.six.mod.scale(1, 0.1, 1);
}

/**
 *Animates the 'ship' about the y axis.
 */
var g_last = Date.now();
function animate(Builds) {
    
    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;
    var rotation = ((10*elapsed)/1000.0)%360;
    
    Builds.three.mod.rotate(rotation, 0, 1, 0);
    Builds.six.mod.rotate(rotation, 0, 1, 0);
}




