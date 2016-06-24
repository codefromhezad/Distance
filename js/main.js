$( function() {

	var WIDTH = 600,
	    HEIGHT = 600;

	var VIEW_ANGLE = 45,
	    ASPECT = WIDTH / HEIGHT,
	    NEAR = 1,
	    FAR = 1000;

	var $container = $('#main-screen');

	var renderer = new THREE.WebGLRenderer({ antialias: true });
	var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

	var scene = new THREE.Scene();

	camera.position.z = 300;

	renderer.setSize(WIDTH, HEIGHT);

	$container.append(renderer.domElement);

	/* SHADER ATTRIBUTES */
	var uniforms = {
	    resolution: {
	        type: 'vec2',
	        value: {x: WIDTH, y: HEIGHT}
	    }
	};

	/* LOADING SHADERS */
	var shaderMaterial = new THREE.ShaderMaterial({
	    vertexShader:   $('#vertexshader').text(),
	    fragmentShader: $('#fragmentshader').text(),
	    uniforms: uniforms,
	    depthWrite: false,
		depthTest: false
	});

	/* FULLSCREEN QUAD */
	var quad = new THREE.Mesh(
		new THREE.PlaneGeometry(2, 2),
		shaderMaterial
	);

	scene.add(quad);

	renderer.render(scene, camera);
});