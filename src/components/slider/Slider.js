/* eslint-disable no-console */
import React, { Component } from 'react';
// import { navigate } from '@reach/router';
import { gsap, Power0 } from 'gsap';
import Spinner from '../../../content/assets/loader.gif';
import DefaultImg from '../../../content/assets/default.png';
import { store } from './Store';
import { vertexShader, fragmentShader } from './Shaders';
import Gl from './Gl';
import * as THREE from 'three/build/three.module';

let animObj = null;

const loader = new THREE.TextureLoader();
loader.crossOrigin = 'anonymous';

class GlObject extends THREE.Object3D {
	init( el ) {
		this.el = el;
		this.resize();
	}

	resize() {
		const { left, top, width, height } = this.el;
		this.rect = {
			top,
			left,
			width,
			height,
		};

		this.pos = {
			x: this.rect.left + this.rect.width / 2 - window.innerWidth / 2,
			y: this.rect.top + this.rect.height / 2 - window.innerHeight / 2,
		};

		this.position.y = this.pos.y;
		this.position.x = this.pos.x;

		this.updateX();
	}

	updateX( current ) {
		current && ( this.position.x = current + this.pos.x );
	}
}

const segments = 128;
const geometry = new THREE.PlaneBufferGeometry( 1, 1, segments, segments );
const planeMat = new THREE.ShaderMaterial( {
	transparent: true,
	fragmentShader,
	vertexShader,
});

const raycaster = new THREE.Raycaster();

class Plane extends GlObject {
	init( el, gl ) {
		super.init( el, gl );
		this.gl = gl;
		this.geo = geometry;
		this.url = null;
		this.mat = planeMat.clone();

		this.mat.uniforms = {
			uTime: { value: 0 },
			uTexture: { value: 0 },
			uMeshSize: {
				value: new THREE.Vector2( this.rect.width, this.rect.height ),
			},
			uImageSize: { value: new THREE.Vector2( 0, 0 ) },
			uScale: { value: 0.75 },
			uVelo: { value: 0 },
		};

		this.img = new Image();
		this.img.src = el.imgSrc;
		var natWidth = 1884, natHeight = 1884;

		// this.img.addEventListener("load", function () {
		// 	natWidth = this.naturalWidth;
		// 	natHeight = this.naturalHeight;
		// });

		this.texture = loader.load(this.img.src, (texture) => {
			texture.minFilter = THREE.LinearFilter;
			texture.generateMipmaps = false;
			this.mat.uniforms.uTexture.value = texture;
			this.mat.uniforms.uImageSize.value = new THREE.Vector2(natWidth, natHeight);
		});

		this.mesh = new THREE.Mesh( this.geo, this.mat );
		this.mesh.scale.set( this.rect.width, this.rect.height, 1 );
		this.mesh.position.set( 0, this.rect.height / 2 + 15, 534 );
		this.gl.camera.position.set( 0, this.rect.height / 2, 1000 );

		this.add( this.mesh );
		this.gl.scene.add( this );

		this.onWindowResize = this.onWindowResize.bind( this );
		window.addEventListener( 'resize', this.onWindowResize );
	}

	onWindowResize() {
		this.resize();
		this.mesh.scale.set( this.rect.width, this.rect.height, 1 );
	}
}

const _getClosest = ( item, array, getDiff ) => {
	let closest, diff;

	if ( ! Array.isArray( array ) ) {
		throw new Error( 'Get closest expects an array as second argument' );
	}

	array.forEach( function( comparedItem, comparedItemIndex ) {
		const thisDiff = getDiff( comparedItem, item );

		if (
			thisDiff >= 0 &&
			( typeof diff === 'undefined' || thisDiff < diff )
		) {
			diff = thisDiff;
			closest = comparedItemIndex;
		}
	} );

	return closest;
};

const number = ( item, array ) => {
	return _getClosest( item, array, function( comparedItem, item ) {
		return Math.abs( comparedItem - item );
	} );
};

class Slider extends Component {
	constructor( props ) {
		super( props );
		this.bindAll();
		this.gl = new Gl();
		this.posts = props.posts;

		this.opts = {
			speed: 2,
			threshold: 50,
			ease: 0.075,
		};

		this.animate = this.animate.bind( this );
		this.mouse = new THREE.Vector2();
		this.state = {
			resizeId: 0,
			loading: false,
			bgColor: '#111',
			textColor: '#fff',
			posts: props.posts ? props.posts : [],
			colors: [],
			error: '',
			target: 0,
			current: 0,
			currentRounded: 0,
			y: 0,
			on: {
				x: 0,
				y: 0,
			},
			off: 0,
			progress: 0,
			diff: 0,
			max: 0,
			min: 0,
			snap: {
				points: [],
			},
			flags: {
				dragging: false,
			},
			counter: 0,
			timerID: '',
			pressHoldDuration: 60,
			intersected: '',
			selectedPost: '',
			activeItemIndex: 0,
		};

		this.colors = [];
		this.titleColors = [];
		this.items = [];
		this.planes = [];

		this.events = {
			move: store.isDevice ? 'touchmove' : 'mousemove',
			up: store.isDevice ? 'touchend' : 'mouseup',
			down: store.isDevice ? 'touchstart' : 'mousedown',
		};

		this.onComplete = this.onComplete.bind( this );
		this.timer = this.timer.bind( this );
		this.onWindowResize = this.onWindowResize.bind( this );
		this.doneResizing = this.doneResizing.bind(this);
	}

	createMarkup = ( data ) => ( {
		__html: data,
	} );

	doneResizing() {
		this.setBounds();
		this.updateCache();
		this.calc();
		this.transformItems();
		this.clampTarget();
		console.log('done');
	}

	onWindowResize() {
		const state = this.state;
		this.gl.camera.aspect = window.innerWidth / window.innerHeight;
		this.gl.camera.updateProjectionMatrix();
		this.gl.renderer.setSize( window.innerWidth, window.innerHeight );

		// this.updateCache();
		// this.setBounds();
		// this.animate();
		// this.clampTarget();

		console.log('resize');

		// clearTimeout(state.resizeId);
		// state.resizeId = setTimeout(this.doneResizing, 1000);
	}

	componentDidMount() {
		this._isMounted = true;

		if (this._isMounted) {
			const canvasEl = document.createElement("div");
			canvasEl.id = 'slide_canvas';
			canvasEl.appendChild( this.gl.domEl );
			document.body.appendChild(canvasEl);
			this.canvasEl = canvasEl;

			this.posts.map(({ node }) => {
				if (node.featured_media.source_url) {
					this.items.push(node);
				}
			})

			for (let i = 0; i < this.items.length; i++) {
				const item = this.items[i];
				const itemWidth = window.innerWidth * 0.7;
				const padding = window.innerWidth * 0.15;
				const left = ((i + 1) * padding) + (itemWidth * i);
				const right = left + itemWidth;
				const itemHeight = itemWidth / (16 / 9);

				// Push to cache
				item.left = left;
				item.right = right;
				item.width = itemWidth;
				item.height = itemHeight;
				item.top = (window.innerHeight - itemHeight) / 2 - 15;
				item.imgSrc = item.featured_media.source_url;
				item.dataURL = '/project/' + item.slug;
			}

			this.init();
		}
	}

	componentWillUnmount() {
		this._isMounted = false;
		this.stop();
		this.destroy();
		this.canvasEl.removeChild( this.gl.renderer.domElement );
	}

	bindAll() {
		[ 'onDown', 'onMove', 'onUp' ].forEach(
			( fn ) => ( this[ fn ] = this[ fn ].bind( this ) )
		);
	}

	init() {
		gsap.utils.pipe( this.setup(), this.on() );
	}

	destroy() {
		this.off();
		this.state = null;
		this.items = null;
		this.planes = null;
		this.opts = null;
	}

	on() {
		const { move, up, down } = this.events;

		window.addEventListener( 'resize', this.onWindowResize );
		window.addEventListener( down, this.onDown );
		window.addEventListener( move, this.onMove );
		window.addEventListener( up, this.onUp );

		this.start();
	}

	off() {
		const { move, up, down } = this.events;

		window.removeEventListener( down, this.onDown );
		window.removeEventListener( move, this.onMove );
		window.removeEventListener( up, this.onUp );
		window.removeEventListener( 'resize', this.onWindowResize );
	}

	setBounds() {
		const state = this.state;

		// Set bounding
		state.max = -(
			this.items[ this.items.length - 1 ].right -
			(window.innerWidth * 0.7) -
			(window.innerWidth * 0.15)
		);
	}

	updateCache() {
		const state = this.state;

		// Cache stuff
		for (let i = 0; i < this.items.length; i++ ) {
			const item = this.items[i];
			const itemWidth = window.innerWidth * 0.7;
			const padding = window.innerWidth * 0.15;
			const left = ((i + 1) * padding) + (itemWidth * i);
			const right = left + itemWidth;
			const itemHeight = itemWidth / (16 / 9);

			// Push to cache
			this.items[i].left = left;
			this.items[i].right = right;
			this.items[i].width = itemWidth;
			this.items[i].height = itemHeight;
			this.items[i].top = (window.innerHeight - itemHeight) / 2 - 15;
			this.items[i].min = window.innerWidth;
			this.items[i].max = state.max - window.innerWidth;
		}
	}

	setup() {
		const state = this.state;

		if ( this._isMounted ) {
			this.setBounds();
		}

		// Global timeline
		// this.tl = gsap
		// 	.timeline( {
		// 		paused: true,
		// 		defaults: {
		// 			duration: 1,
		// 			ease: 'linear',
		// 		},
		// 	} )
		// 	.fromTo(
		// 		'.js-progress-line-2',
		// 		{
		// 			scaleX: 1,
		// 		},
		// 		{
		// 			scaleX: 0,
		// 			duration: 0.5,
		// 			ease: 'power3',
		// 		},
		// 		0
		// 	)
		// 	.fromTo(
		// 		'.js-titles',
		// 		{
		// 			yPercent: 0,
		// 		},
		// 		{
		// 			yPercent: -100,
		// 		},
		// 		0
		// 	)
		// 	.fromTo(
		// 		'.js-progress-line',
		// 		{
		// 			scaleX: 0,
		// 		},
		// 		{
		// 			scaleX: 1,
		// 		},
		// 		0
		// 	);

		// Cache stuff
		for (let i = 0; i < this.items.length; i++ ) {
			const el = this.items[ i ];
			const { left, right, width } = el;

			// Create webgl plane
			const plane = new Plane();
			el.plane = plane;
			plane.init( el, this.gl );

			// Timeline that plays when visible
			const tl = gsap.timeline( { paused: true } ).fromTo(
				plane.mat.uniforms.uScale,
				{
					value: 0.5,
				},
				{
					value: 1.56,
					ease: 'linear',
				}
			);
			el.tl = tl;

			const { dataUrl } = el;

			plane.url = dataUrl;
			plane.post = state.posts[ i ];

			const mesh = plane.mesh;
			this.planes.push( mesh );
			el.min = window.innerWidth;
			el.max = state.max - window.innerWidth;
			el.out = false;
		}
	}

	calc() {
		const state = this.state;
		state.current += ( state.target - state.current ) * this.opts.ease;
		state.currentRounded = ( state.current * 100 ) / 100;
		state.diff = ( state.target - state.current ) * 0.00125;

		state.progress = gsap.utils.clamp(
			0,
			1,
			state.currentRounded /
				Math.round(
					state.max +
						( state.max * ( 1 / this.items.length ) -
						(window.innerWidth * 0.7) * ( 1 / this.items.length ) -
						(window.innerWidth * 0.15) * ( 1 / this.items.length ) )
				)
		);

		// this.tl && this.tl.progress( state.progress );
	}

	start() {
		if ( ! this.frameId ) {
			this.frameId = requestAnimationFrame( this.animate );
		}
	}

	stop() {
		this.frameId = cancelAnimationFrame( this.frameId );
	}

	animate() {
		this.frameId = requestAnimationFrame( this.animate );
		// this.gl.water.material.uniforms.time.value += 1.0 / 60.0;
		this.gl.renderer.render( this.gl.scene, this.gl.camera );
		this.calc();
		this.transformItems();
	}

	transformItems() {
		const { flags, colors, titleColors } = this.state;

		for ( let i = 0; i < this.items.length; i++ ) {
			const item = this.items[ i ];
			const { translate, isVisible, progress } = this.isVisible( item );

			item.plane.updateX( translate );
			item.plane.mat.uniforms.uVelo.value = this.state.diff;

			if ( ! item.out && item.tl ) {
				item.tl.progress( progress );
			}

			if ( isVisible || flags.resize ) {
				item.out = false;
			} else if ( ! item.out ) {
				item.out = true;
			}

		}
	}

	isVisible( { left, right, width, min, max } ) {
		const { currentRounded } = this.state;

		const translate = gsap.utils.wrap( min, max, currentRounded );
		const threshold = this.opts.threshold;
		const start = left + translate;
		const end = right + translate;
		const isVisible = start < threshold + window.innerWidth && end > -threshold;

		const progress = gsap.utils.clamp(
			0,
			1,
			1 - ( translate + left + width ) / ( window.innerWidth + width )
		);

		return {
			translate,
			isVisible,
			progress,
		};
	}

	clampTarget() {
		const state = this.state;
		const { closest } = this.closest();
		state.target = gsap.utils.clamp( state.max, state.min, closest );
	}

	getPos( { changedTouches, clientX, clientY, target } ) {
		const x = changedTouches ? changedTouches[ 0 ].clientX : clientX;
		const y = changedTouches ? changedTouches[ 0 ].clientY : clientY;

		return {
			x,
			y,
			target,
		};
	}

	onComplete() {
		const state = this.state;
		this.animBox.style.opacity = 0;

		// navigate( state.intersected, {
		// 	state: { post: state.selectedPost },
		// } );
	}

	timer() {
		const state = this.state;
		const items = this.items;

		// this.gl.scene.fog.density += 0.000001 * state.counter;

		if ( state.counter < state.pressHoldDuration ) {
			state.timerID = requestAnimationFrame( this.timer );
			state.counter++;
		} else {
			// animObj.addEventListener( 'complete', this.onComplete );
			// animObj.play();
		}
	}

	onDown( e ) {
		const { x, y } = this.getPos( e );
		const { flags, on } = this.state;
		const state = this.state;

		flags.dragging = true;
		on.x = x;
		on.y = y;

		e.preventDefault();
		this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		this.mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

		raycaster.setFromCamera( this.mouse, this.gl.camera );
		const intersects = raycaster.intersectObjects( this.planes );
		let INTERSECTED;

		if ( intersects.length > 0 ) {
			if ( INTERSECTED != intersects[ 0 ].object ) {
				INTERSECTED = intersects[ 0 ].object;
				state.intersected = INTERSECTED.parent.url;
				state.selectedPost = INTERSECTED.parent.post;
				state.activeItemIndex = INTERSECTED.parent.uuid;
				requestAnimationFrame( this.timer );
			}
		} else {
			INTERSECTED = null;
		}
	}

	closest() {
		const numbers = [];

		this.items.forEach( ( slide, index ) => {
			const center = slide.left + (slide.width / 2);
			const fromCenter = window.innerWidth / 2 - center;
			numbers.push( fromCenter );
		} );

		if ( this.state.target <= this.state.max ) {
			const wrap = gsap.utils.wrap(
				this.state.min,
				this.state.max,
				this.state.target
			);
			this.state.target = wrap + this.state.max;
		}

		let closest = number( this.state.target, numbers );
		closest = numbers[ closest ];

		return {
			closest,
		};
	}

	onUp() {
		const state = this.state;
		// const { currentRounded } = this.state;
		// const scene = this.gl.scene;
		// const items = this.items;
		state.flags.dragging = false;
		this.clampTarget();
		state.off = state.target;

		// state.counter = 0;
		// cancelAnimationFrame( state.timerID );

		// const start = performance.now();
		// requestAnimationFrame( function animate( time ) {
		// 	// timeFraction goes from 0 to 1
		// 	let timeFraction = ( time - start ) / 500;
		// 	if ( timeFraction > 1 ) timeFraction = 1;
		// 	// scene.fog.density = scene.fog.density - 0.0005 * timeFraction;
		// 	// if ( scene.fog.density < 0.001 ) scene.fog.density = 0.001;

		// 	if ( timeFraction < 1 ) {
		// 		requestAnimationFrame( animate );
		// 	}
		// } );
	}

	onMove( e ) {
		const { x, y } = this.getPos( e );
		const state = this.state;

		if ( ! state.flags.dragging ) return;

		const { off, on } = state;
		const moveX = x - on.x;
		const moveY = y - on.y;

		if ( Math.abs( moveX ) > Math.abs( moveY ) && e.cancelable ) {
			e.preventDefault();
			e.stopPropagation();
		}

		state.target = off + moveX * this.opts.speed;
	}

	render() {
		const {
			loading,
			posts,
			error,
			colors,
			bgColor,
			textColor,
		} = this.state;

		return (
			<React.Fragment>
				<div
					className="pagewipe"
					ref={(ref) => (this.animBox = ref)}
				></div>

				{ error && (
					<div
						className="alert alert-danger"
						dangerouslySetInnerHTML={this.createMarkup(error)}
					/>
				)}
				{ this._isMounted && this.items.length ? (
					<React.Fragment>
						<div
							className="slider-wrap"
						// style={ { background: bgColor } }
						>
							<div className="titles">
								<div className="titles__title titles__title--proxy">
									Lorem ipsum
								</div>
								<div className="titles__list | js-titles">
									{this.items.map((item, index) => (
										<div
											key={item.id}
											style={{ color: textColor }}
											className="titles__title | js-title"
										>
											{ item.title.rendered}
										</div>
									))}
								</div>
							</div>

							{ /* <div className="titles faded">
							<div className="titles__title titles__title--proxy">
								Lorem ipsum
							</div>
							<div className="titles__list | js-titles">
								{ posts.map( ( post, index ) => (
									<div
										key={ index }
										style={ { color: textColor } }
										className="titles__title | js-title"
									>
										{ post.title.rendered }
									</div>
								) ) }
							</div>
						</div> */ }

							<div className="progress">
								<div className="progress__line | js-progress-line"></div>
								<div className="progress__line | js-progress-line-2"></div>
							</div>
						</div>
					</React.Fragment>
				) : (
						''
					)}
				{ loading && (
					<div className="loader-wrap">
						<img className="loader" src={Spinner} alt="Loader" />
					</div>
				)}
			</React.Fragment>
		);
	}
}

export default Slider;
