**Lightweight Web Component Builder**

`wc` is a tiny, zero-dependency utility that removes the boilerplate from creating vanilla Web Components. It handles Shadow DOM, property-to-attribute synchronization, type coercion, and lifecycle management.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Creating a Component](#creating-a-component)
3. [The Definition Object (`def`)](#the-definition-object-def)
    * [State & Content: `props`, `owns`, `state`, `content`, `css`, `render`](#state--content)
    * [Interactivity: `events`](#events)
    * [Lifecycle Hooks: `create`, `insert`, `change`, `remove`, `adopt`](#lifecycle-hooks)
4. [Component Instance API (The `this` context)](#component-instance-api)
    * [Properties](#properties)
    * [Methods](#methods)
    * [Events](#events)
5. [Global API](#global-api)
6. [Comprehensive Example](#comprehensive-example)

   

Getting Started
---------------

Include the script in your project to start defining components. Tags are automatically prefixed with wc-.

    <script src="wc.js"></script>

Creating a Component
--------------------

The `wc` function takes a **name** (string) and a **definition** (object).

    wc("hello", {
        props: { name: "World" },
        render: function() {
            this.html(`Hello, ${this.name}!`);
        }
    });

The Definition Object (`def`)
-----------------------------

### Lifecycle Hooks

`wc` maps standard CustomElement lifecycle methods to simple callbacks on the `def` object. All hooks are passed the same context details: `target`: the element, `type`: the event name, `detail`: the def or change details. In addition, DOM events are raised on the element as the hooks are invoked: `event.type` matches the lifecycle event name (ex: "create"), and the event `.detail` contains the `def` object.

*   **`create()`**: Called inside the constructor before the element is attached to the DOM. Useful for deep initialization.
*   **`insert()`**: Maps to `connectedCallback`. Called when the element is added to the page. Useful for fetching initial data.
*   **`change(detail: {name, was, is})`**: Maps to `attributeChangedCallback`. Called when a property defined in `props` is mutated.
*   **`remove()`**: Maps to `disconnectedCallback`. Called when the element is removed. Useful for cleaning up intervals or global listeners.
*   **`adopt()`**: Maps to `adoptedCallback`. Called when the element is moved to a new document.


### State & Content

*   **`props`**: Object defining observed/bound attributes. Supports `String`, `Number`, `Boolean`, and `Date`.
*   **`owns`**: Object of un-bound element instance properties, like title, tabIndex, or value.
*   **`state`**: Object of un-bound data, cloned on instatiation, used to store transient and non-standard properties.
*   **`css`**: String or Function returning CSS for the Shadow DOM.
*   **`content`**: Initial HTML structure injected into the component.
*   **`render`**: Function to update the DOM. Automatically receives the element as the first argument.

  
#### `def.props`

An object defining the observed attributes and their default values. `wc.js` uses the default value's constructor to automatically coerce types (`String`, `Number`, `Boolean`, `Date`) when attributes are read.

*   **Use Case:** Managing component state and syncing it automatically with HTML attributes.
    

JavaScript

    props: {
        count: 0,        // Coerces to Number
        disabled: false, // Coerces to Boolean
        label: "Click"   // Coerces to String
    }


#### `def.owns`

An object defining the live element's own properties, like title or tabIndex. These are applied early, at instantiation time before `props` are applied or `render` is first called.

*   **Use Case:** Configuring standard HTML properties, storing state, defining instance methods, setting defaults.
    
JavaScript

    owns: {
        title: "some tooltip",
        reset: function(){this.props = this.def.props;},
        uid: "_"+Math.random().toString(36).slice(-8),
    }

#### `def.state`

An object holding state or data needed by the component, but not bound to attributes. It's cloned from the `def` early, at instantiation time after `owns` and before `props` are applied or `render` is first called.

*   **Use Case:** Internal state, holding deeply nested data, external access to other components.
    

JavaScript

    state: {
        born: new Date(),
        user: window.user.name,
        hasBeenUsed: false,
    }


#### `def.css`

A string (or a function returning a string) containing the CSS for the Shadow DOM.

*   **Use Case:** Scoping styles so they don't leak into the global document.
    

JavaScript

    css: `root { display: block; background: #eee; padding: 1rem; }`
    // OR
    css: function(elm) { return `root { color: ${elm.color}; }`; }

#### `def.content`

A string (or a function returning a string) containing the initial HTML injected into the component before the first render.
A `<template>` object can also be passed here, using `<slot>` mechanics to populate content from the pre-instantiated instance innerHTML

*   **Use Case:** Providing structural boilerplate or loading states.
    

JavaScript

    content: `<span id="label">Loading...</span>`

#### `def.render`

A function called to update the DOM. You can call this manually via `this.render()`, or bind it to fire on state changes.

*   **Use Case:** Updating the UI when data changes.
    

JavaScript

    render: function() {
        this.root.innerHTML = `<div>Count is: ${this.count}</div>`;
    }

### `def.events`

An object mapping standard DOM event names to listener functions. These are automatically bound to the component instance via `addEventListener`.

*   **Use Case:** Handling clicks, hovers, or keyboard input declaratively.
    

JavaScript

    events: {
        click: function(e) {
            this.count++;
            this.render(); // Re-render on click
        },
        mouseenter: function(e) { /* ... */ }
    }
    

Component Instance API
----------------------

Within the component logic, `this` refers to the element instance.

### Methods

| Method                      | Returns            | Description                                                                                                                                     |
|-----------------------------|--------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| this.render()               | undefined          | Triggers the render function defined in your def object.                                                                                        |
| this.$(cssSelector)         | Array<Node>        | Runs querySelectorAll inside the Shadow DOM, but returns a true Array instead of a NodeList, allowing immediate use of .map(), .filter(), etc.  |
| this.raise(name, [details]) | this               | A shortcut for dispatching Custom Events. Emits an event on the component. Returns this for chaining.                                           |
| this.on(event, cb, blnOnce) | this               | A shortcut for addEventListener().  Returns this for chaining.                                                                                  |



### Properties

| Property            | Type             | Description                                                                                     | Use Case                                                                              |
|---------------------|------------------|-------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| this.root           | HTMLElement      | A <root> element inside the Shadow DOM that wraps your component's HTML.                        | Target for innerHTML rendering.                                                       |
| this.css(=[String]) | CSSRuleList/this | Getter/Setter for the components CSS. Setting appends new CSS string, get returns rules         | Shadow DOM styles access, adding new CSS rules to component                           |
| this.styleTag       | HTMLStyleElement | The <style> element inside the Shadow DOM.                                                      | Dynamically modifying component stylesheets.                                          |
| this.def            | Object           | A reference to the original definition object passed to wc().                                   | Accessing static data or shared logic.                                                |
| this.props          | Object           | returns a _copy_ of the formal props, or sets all passed object properties on instance.         | Accessing state/config.                                                               |
| this.state          | Object           | A reference to the original definition object's state property.                                 | Accessing state or nested internal data.                                              |
| this.elms           | Object           | A proxy object containing live references to all Shadow DOM children that have an id attribute. | Quick DOM querying (e.g., this.elms.myButton instead of querySelector('#myButton')).  |
| this.initialContent | String           | The raw Light DOM innerHTML of the tag before the Shadow DOM attached.                          | Wrapping or transforming pre-existing HTML inside the tag.                            |



### Events
Every component instance automatically emits a custom `change` event whenever an observed property (defined in `props`) is updated.

JavaScript

    const myComponent = document.querySelector('wc-test');
    myComponent.addEventListener('change', (e) => {
        console.log(`Property ${e.detail.name} changed from ${e.detail.was} to ${e.detail.is}`);
    });

   

Global API
----------

*   `wc.defs`: Registry of all definitions.
*   `wc.elms`: Global registry of all active elements that have an `id` attribute.
*   `wc.prefix`: `String` - the custom HTML tag prefix, default is `wc`.

Comprehensive Example
---------------------

    wc("counter", {
        props: { count: 0 },
        css: `root { font-family: sans-serif; border: 1px solid #ccc; padding: 10px; }`,
        content: `
            <button id="down">-</button>
            <span id="num"></span>
            <button id="up">+</button>
        `,
        render: function() {
            this.elms.num.textContent = this.count;
        },
        insert: function() {
            this.elms.up.onclick = () => this.count++;
            this.elms.down.onclick = () => this.count--;
        },
        change: function() {
            this.render();
            this.raise("updated", { val: this.count });
        }
    });



