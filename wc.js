// wc.js - web component wrapper.  @dandavis, MIT
function wc(name, def) {

	wc.defs[name] = def; // add definition to global collecitno

	// track attribs/props to auto-bind to own properties:
	const PROPS = Object.keys(def.props || {});
	const PROP_TYPES = {};
	const types = [Boolean, Number, Date, String];
	
	PROPS.forEach(p => { // assign each prop a type based on the provided default value
		PROP_TYPES[p] = types.find(T => T === def.props[p]?.constructor) || (x => x)
	});
	
	class wcMaker extends HTMLElement {
		constructor() {
			super();
			const shadow = this.attachShadow({
				mode: "open"
			});
			
			Object.keys(def.owns || {}).forEach( k=>this[k]=def.owns[k] );			

			if(def.state) this.state = structuredClone(def.state);
			
			var hide = Object.defineProperty.bind(Object, this); // silent own property publisher
			
			hide("styleTag", { // this.styleTag access
				value: shadow.appendChild(document.createElement("style"))
			});
			
			hide("root", { // shadow root access
				value: shadow.appendChild(document.createElement("root"))
			});
			
			hide("def", { // component definition access
				value: def
			});		
			
			hide("css", {
				get: function(){return this.styleTag.sheet.cssRules;},
				set: function(css) {
					this.styleTag.textContent += css;
					return this;
				},
			});
			
			hide("props", { // component definition access
				get: function(){
					var o = {};
					PROPS.forEach(p => o[p] = this[p]);
					return o;
				},
				set: function(v){
					Object.keys(v||{}).forEach(p => this[p] = v[p]);
				}
			});
			
			hide("elms", { // this.elms (id-having children by id) access
				value: {}
			});
			
			if (def.render) hide("render", { // custom renderer as own method
				value: def.render.bind(this, this)
			});

			PROPS.forEach(key => { // bind props to attribs, vice versa, set defaults if ommitted
				if (!this.hasAttribute(key)) {
					this.setAttribute(key, def.props[key] === false ? "" : def.props[key]);
				}
				Object.defineProperty(this, key, {
					enumerable: true,
					get() { // coerces to definition data type on read
						return PROP_TYPES[key](this.getAttribute(key));
					},
					set(v) {
						this.setAttribute(key, v === false ? "" : v);
					}
				});
			}, this);
			
			// bind any userland and cusotm events in def:
			Object.keys(def.events || {}).forEach(type => {
				this.addEventListener(type, def.events[type]);
			}, this);
			
			// attach helper methods to component, eg this.$
			Object.keys(wc._).forEach(x => Object.defineProperty(this, x, {
				value: wc._[x].bind(this)
			}));
			
			// if def has a create callback then call it back
			def.create?.call(this, {
				target: this,
				type: "create",
				detail: def
			});

		}
		
		connectedCallback(e) {
			// memorize initial html in a hidden static own prop:
			Object.defineProperty(this, "initialContent", {
				value: this.innerHTML
			});
			
			if (def.content) this.shadowRoot.children[1].innerHTML = def.content.call ? def.content.call(this, this) : def.content;
			if (def.css) this.shadowRoot.children[0].textContent = def.css.call ? def.css.call(this, this) : def.css;
			if (this.id) wc.elms[this.id] = this; // publish to global elm list by id if any
			if (this.render?.call) this.render(); // render initial version upon insertion
			this.$("[id]").forEach(elm => { // build out live children with id attribs shortcuts
				Object.defineProperty(this.elms, elm.id, {
					get: this.querySelector.bind(this.shadowRoot.children[1], "#" + elm.id),
					enumerable: true
				});
			});
			def.insert?.apply(this, arguments); // lifetime event
		}
		
		attributeChangedCallback(name, was, is) {
			if (this[name] != is) this[name] = is; // update prop from attrib if needed
			def.change?.apply(this, arguments); // if change lifetime callback in def, call it
			this.raise("change", { // raise custom change event (for addEventListeners on component)
				name,
				was,
				is
			});
		}
		disconnectedCallback(e) { // removed from dom, unmemorize and run user cleanup if provided
			def.remove?.apply(this, arguments);
			if (this.id) delete wc.elms[this.id];
		}
		adoptedCallback(e) { // pipe this lifetime event to definition handler
			def.adopt?.apply(this, arguments);
		}
		static get observedAttributes() { // require by CustomElements
			return PROPS;
		}
		raise(name, details) { // custom event maker shortcut own method
			this.dispatchEvent(new CustomEvent(name, {
				detail: details || {}
			}));
			return this;
		}
	} //end class wcMaker
	customElements.define("wc-" + name, wcMaker);
}//end wc component maker()

wc._ = {
	$: function(css) {
		return [].slice.call(this.shadowRoot.querySelectorAll(css));
	},
	on: function(eventName, eventHandler, blnOnce){
		this.addEventListener(eventName, eventHandler, blnOnce ? { once: true } : {});
		return this;
	},
};

wc.defs={};
wc.elms={};
