var MAX_PARSING_RECURSIONS = 50;

var ShaderRenderer = function() {

	this.init = function(screen_id, width, height) {

		/* Init renderer DOM and data */
		this.width = width;
		this.height= height;
		this.canvas = document.getElementById(screen_id);

		if( this.canvas.length == 0 ) {
			console.error("Can't find any canvas with id '"+screen_id+"'");
			return;
		}

		/* Init scene / renderer */
		this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
		this.renderer.setSize(this.width, this.height);

		this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);
		this.scene = new THREE.Scene();

		/* Init shader constants as uniforms */
		this.uniforms = {
		    u_resolution: { type: 'vec2', value: {x: this.width, y: this.height} },
		    u_fov: { type: 'f', value: 1 }
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

		/* Parse @import directive */
		var import_match = shader_code.match(/\@import\s*\(\s*(.+)\s*\)/i);
		if( import_match ) {
			var directive_length = import_match[0].length;
			var directive_file = import_match[1];
			var directive_index = import_match.index;
			
			var that = this;
			this.loadFile(directive_file, function(imported_data) {
				shader_code = shader_code.substring(0, directive_index) + 
					imported_data + 
					shader_code.substring(directive_index + directive_length);

				that.parseDistanceShader(shader_code, done_callback, recursion_level + 1);
			});

			return;
		}

		/* Remove eventual non ascii characters in the shader code */
		shader_code = shader_code.replace(/[^\x00-\x7F]/g, "");

		/* Everything parsed, let's execute the done callback */
		if( done_callback ) {
			done_callback(shader_code);
		}
	}

	this.loadFragmentShader = function(fragment_shader_file) {
		var that = this;

		this.loadFile(fragment_shader_file, function(fragment_data) {
			that.parseDistanceShader(fragment_data, function(parsed_fragment) {
				that.shaderMaterial.fragmentShader = parsed_fragment;
				that.shaderMaterial.needsUpdate = true;

				that.render();
			});
		});
	}

	this.render = function() {
		this.renderer.render(this.scene, this.camera);
	}
}