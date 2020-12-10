import { store } from './Store';
import waterNormal from '../../../content/assets/waternormals.jpg';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water';

class Gl {
	constructor() {
		this.scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(
			90,
			window.innerWidth / window.innerHeight,
			1,
			1000
		);

		this.camera = camera;

		this.parameters = {
			distance: 400,
			inclination: 0.5,
		};

		this.renderer = new THREE.WebGL1Renderer( {
			alpha: true,
			antialias: true,
		} );

		// this.renderer.setPixelRatio( 1 );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.setClearColor( 0x111111, 1 );
		this.init();
	}

	init() {
		const domEl = this.renderer.domElement;
		domEl.classList.add( 'dom-gl' );
		this.domEl = domEl;

		// const white = new THREE.Color( 0xffffff );
		// const black = new THREE.Color( 0x111111 );
		// const charcoal = new THREE.Color(0x111111 );
		// this.scene.background = charcoal;

		// const fogColor = black;
		// const density = 0.001;
		// this.scene.fog = new THREE.FogExp2( fogColor, density );

		// const waterGeometry = new THREE.PlaneBufferGeometry( 10000, 10000 );

		// const water = new Water( waterGeometry, {
		// 	textureWidth: 512,
		// 	textureHeight: 512,
		// 	waterNormals: new THREE.TextureLoader().load( waterNormal, function(
		// 		texture
		// 	) {
		// 		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		// 	} ),
		// 	alpha: 0.8,
		// 	sunColor: charcoal,
		// 	waterColor: black,
		// 	distortionScale: 3.7,
		// 	fog: this.scene.fog !== undefined,
		// } );

		// water.material.uniforms.size.value = 0.1;
		// water.rotation.x = -Math.PI / 2;
		// this.water = water;
		// this.scene.add( water );

		// var sky = new THREE.Sky();
		// this.sky = sky;
		// this.sky.scale.setScalar( 10000 );
		// console.log(this.sky);
		// this.scene.add( sky );

		// this.sky.material.uniforms['turbidity'].value = 10;
		// this.sky.material.uniforms['rayleigh'].value = 2;
		// // this.sky.material.uniforms['luminance'].value = 1;
		// this.sky.material.uniforms['mieCoefficient'].value = 0.005;
		// this.sky.material.uniforms['mieDirectionalG'].value = 0.8;

		// var cubeCamera = new THREE.CubeCamera(0.1, 1, 512);
		// cubeCamera.renderTarget.texture.generateMipmaps = true;
		// cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
		// this.cubeCamera = cubeCamera;
	}
}

export default Gl;
