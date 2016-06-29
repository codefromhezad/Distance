var MAX_PARSING_RECURSIONS = 50;

var ShaderRenderer = function() {

	this.init = function(screen_id, width, height) {

		/* Init renderer DOM and data */
		this.width = width;
		this.height= height;
		this.canvas = document.getElementById(screen_id);
		this.fragment_shader_file = "shaders/fragment.glsl";

		if( this.canvas.length == 0 ) {
			console.error("Can't find any canvas with id '"+screen_id+"'");
			return;
		}

		/* Init scene / renderer */
		this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
		this.renderer.setSize(this.width, this.height);

		this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);
		this.scene = new THREE.Scene();

		/* To help with arrays and for loops in the shader code :
		 * At compile time, arrays of uniforms must have a constant size,
		 * so we'll parse the shader file and write the expected size directly
		 * in the shader code before compiling it. 
		 * It's a limitation of some GLSL implementations I believe but
		 * I may be utterly wrong, I haven't tinkered with shaders for a
		 * long time. And it was actually funny to use kind-of templating
		 * tags in a GLSL source code. It's visible in shaders/fragment.glsl :
		 * - @var(var_name) will replace the statement with a value from the next object :
		 */
		this.custom_shader_variables = {
			num_point_lights: 0,
			distant_field_function: ''
		};

		/* Init/setup shader data as uniforms */
		this.uniforms = {

			/* Aspect uniforms */
		    u_resolution: { type: 'vec2', value: {x: this.width, y: this.height}},
		    
		    /* Camera uniforms */
		    u_camera_position: { type: 'vec3', value: {x: 0.0, y: 2.0, z: -2.0}},
		    u_camera_look_at: { type: 'vec3', value: {x: 0.0, y: 0.0, z: 0.0}},
		    u_camera_up: { type: 'vec3', value: {x: 0.0, y: 1.0, z: 0.0}},

		    /* World lighting uniforms */
		    u_background_color: { type: 'vec3', value: {x: 0.05, y: 0.04, z: 0.03}},
		    u_fog_color: { type: 'vec3', value: {x: 0.5, y: 0.6, z: 0.7}},
		    u_fog_attenuation: { type: 'f', value: 0.1 },
		    
		    /* Actual lighting uniforms */
		    u_ambiant_light: { type: 'vec3', value: {x: 0.1, y: 0.1, z: 0.15} },

		    u_point_lights_position: { type: 'v3v', value: []},
		    u_point_lights_color: { type: 'v3v', value: []},

		    /* General purpose uniforms (top help animating) */
		    u_t: { type: 'f', value: 0},
		};

		/* Init shader material */
		this.shaderMaterial = new THREE.ShaderMaterial({
		    vertexShader: "void main() { gl_Position = vec4(position, 1.0); }",
		    fragmentShader: "void main() { gl_FragColor = vec4(0.0); }",
		    uniforms: this.uniforms,
		    depthWrite: false,
			depthTest: false
		});

		/* Fullscreen quad used as a screen for the fragment shader */
		this.quad = new THREE.Mesh(
			new THREE.PlaneGeometry(2, 2),
			this.shaderMaterial
		);
		this.scene.add(this.quad);
	}

	this.addPointLight = function(position, color) {
		this.uniforms.u_point_lights_position.value.push(position);
		this.uniforms.u_point_lights_color.value.push(color);

		this.custom_shader_variables.num_point_lights += 1;
	}

	this.setDistantFieldFunction = function(distant_field_shader_code) {
		this.custom_shader_variables.distant_field_function = distant_field_shader_code;
	}

	this.setCamera = function(conf) {
		if( conf.position ) {
			this.uniforms.u_camera_position.value = conf.position;
		}

		if( conf.look_at ) {
			this.uniforms.u_camera_look_at.value = conf.look_at;
		}
		
		if( conf.up ) {
			this.uniforms.u_camera_up.value = conf.up;
		}
	}

	this.loadFile = function(file_path, done_callback) {
		$.get(file_path, function(response) {
			done_callback(response);
		}).fail( function(response) {
			console.error("Can't load '" + file_path + "': "+
				"A " + response.status + " error was returned by the server");
		});
	}

	this.parseDistanceShader = function(shader_code, done_callback, recursion_level) {

		if( recursion_level === undefined ) {
			recursion_level = 0;
		}

		if( recursion_level >= MAX_PARSING_RECURSIONS ) {
			console.error("Too much recursion while parsing the shader code. Please check for syntax errors");
			return;
		}


		/* Parse @var directive */
		var var_match = shader_code.match(/\@var\s*\(\s*([^)]+)\s*\)/i);
		if( var_match ) {
			var directive_length = var_match[0].length;
			var directive_var_name = var_match[1];
			var directive_index = var_match.index;
			
			shader_code = shader_code.substring(0, directive_index) + 
				this.custom_shader_variables[directive_var_name] + 
				shader_code.substring(directive_index + directive_length);

			this.parseDistanceShader(shader_code, done_callback, recursion_level + 1);

			return;
		}

		/* Remove eventual non ascii characters in the shader code */
		shader_code = shader_code.replace(/[^\x00-\x7F]/g, "");

		/* Everything parsed, let's execute the done callback */
		if( done_callback ) {
			done_callback(shader_code);
		}
	}

	this.compile = function() {
		var that = this;

		this.loadFile(this.fragment_shader_file, function(fragment_data) {
			that.parseDistanceShader(fragment_data, function(parsed_fragment) {
				that.shaderMaterial.fragmentShader = parsed_fragment;
				that.shaderMaterial.needsUpdate = true;

				that.renderer.render(that.scene, that.camera);
			});
		});
	}
}