🧩 wc.js
========

**Lightweight Web Component Builder**

`wc.js` is a tiny, zero-dependency utility that removes the boilerplate from creating vanilla Web Components. It handles Shadow DOM, property-to-attribute synchronization, type coercion, and lifecycle management.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Creating a Component](#creating-a-component)
3. [The Definition Object (`def`)](#the-definition-object-def)
    * [State & Content: `props`, `content`, `css`, `render`](#state--content)
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

`wc.js` maps standard CustomElement lifecycle methods to simple callbacks on the `def` object.

*   **`create(event)`**: Called inside the constructor before the element is attached to the DOM. Useful for deep initialization.
*   **`insert()`**: Maps to `connectedCallback`. Called when the element is added to the page. Useful for fetching initial data.
*   **`change(name, was, is)`**: Maps to `attributeChangedCallback`. Called when a property defined in `props` is mutated.
*   **`remove()`**: Maps to `disconnectedCallback`. Called when the element is removed. Useful for cleaning up intervals or global listeners.
*   **`adopt()`**: Maps to `adoptedCallback`. Called when the element is moved to a new document.


### State & Content

*   **`props`**: Object defining observed attributes. Supports `String`, `Number`, `Boolean`, and `Date` via default value inference.
*   **`css`**: String or Function returning CSS for the Shadow DOM.
*   **`content`**: Initial HTML structure injected into the component.
*   **`render`**: Function to update the DOM. Automatically receives the element as the first argument.

  
#### `props`

An object defining the observed attributes and their default values. `wc.js` uses the default value's constructor to automatically coerce types (`String`, `Number`, `Boolean`, `Date`) when attributes are read.

*   **Use Case:** Managing component state and syncing it automatically with HTML attributes.
    

JavaScript

    props: {
        count: 0,        // Coerces to Number
        disabled: false, // Coerces to Boolean
        label: "Click"   // Coerces to String
    }

#### `css`

A string (or a function returning a string) containing the CSS for the Shadow DOM.

*   **Use Case:** Scoping styles so they don't leak into the global document.
    

JavaScript

    css: `root { display: block; background: #eee; padding: 1rem; }`
    // OR
    css: function(elm) { return `root { color: ${elm.color}; }`; }

#### `content`

A string (or a function returning a string) containing the initial HTML injected into the component before the first render.

*   **Use Case:** Providing structural boilerplate or loading states.
    

JavaScript

    content: `<span id="label">Loading...</span>`

#### `render`

A function called to update the DOM. You can call this manually via `this.render()`, or bind it to fire on state changes.

*   **Use Case:** Updating the UI when data changes.
    

JavaScript

    render: function() {
        this.root.innerHTML = `<div>Count is: ${this.count}</div>`;
    }

### `events`

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

*   `this.$(selector)`: Returns an **Array** of elements from the Shadow DOM.
*   `this.html(string)`: Getter/Setter for the root innerHTML.
*   `this.css(string)`: Getter/Setter for the shadow stylesheet.
*   `this.raise(name, detail)`: Shortcut for `dispatchEvent` with a CustomEvent.

### Properties

*   `this.elms`: Proxy object for elements with an `id` (e.g., `this.elms.myBtn`).
*   `this.root`: Reference to the internal Shadow DOM wrapper.
*   `this.initialContent`: The original innerHTML of the tag before initialization.


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

Hook

Standard Equivalent

Use Case

`create`

constructor

Internal setup before DOM attachment.

`insert`

connectedCallback

Fired when added to page; fetch data here.

`change`

attributeChangedCallback

React to property mutations.

`remove`

disconnectedCallback

Cleanup listeners or timers.


