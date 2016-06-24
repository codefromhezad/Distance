$( function() {

	var WIDTH = 600,
	    HEIGHT = 600;

	var VIEW_ANGLE = 45,
	    ASPECT = WIDTH / HEIGHT,
	    NEAR = 0.1,
	    FAR = 10000;

	var $container = $('#main-screen');

	var renderer = new THREE.WebGLRenderer();
	var camera = new THREE.PerspectiveCamera(
	                   VIEW_ANGLE,
	                   ASPECT,
	                   NEAR,
	                   FAR );

	var scene = new THREE.Scene();

	camera.position.z = 300;

	renderer.setSize(WIDTH, HEIGHT);
	
	$container.append(renderer.domElement);
});