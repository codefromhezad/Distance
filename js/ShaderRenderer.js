var ShaderRenderer = function(screen_id, width, height, vertex_file, fragment_file) {
	this.width = width;
	this.height= height;
	this.screen_id = screen_id;

	/* INIT SCENE / RENDERER */
	var VIEW_ANGLE = 45,
	    ASPECT = this.width / this.height,
	    NEAR = 1,
	    FAR = 1000;

	var renderer = new THREE.WebGLRenderer({ antialias: true });
	var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

	var scene = new THREE.Scene();

	camera.position.z = 300;

	renderer.setSize(this.width, this.height);

	$('#' + screen_id).append(renderer.domElement);


	/* SHADER ATTRIBUTES */
	this.uniforms = {
	    resolution: {
	        type: 'vec2',
	        value: {x: this.width, y: this.height}
	    }
	};

	/* SHADERS LOADING */
	var that = this;
	$.get(vertex_file, function(vertex_data) {
		$.get(fragment_file, function(fragment_data) {
			that.shaderMaterial = new THREE.ShaderMaterial({
			    vertexShader: vertex_data,
			    fragmentShader: fragment_data,
			    uniforms: that.uniforms,
			    depthWrite: false,
				depthTest: false
			});

			/* FULLSCREEN QUAD */
			var quad = new THREE.Mesh(
				new THREE.PlaneGeometry(2, 2),
				that.shaderMaterial
			);

			/* Render */
			scene.add(quad);

			renderer.render(scene, camera);
		});
	});
}