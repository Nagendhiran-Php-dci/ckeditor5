/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module engine/view/observer/observer
 */

import DomEmitterMixin, { type Emitter as DomEmitter } from '@ckeditor/ckeditor5-utils/src/dom/emittermixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';

import type Document from '../document';
import type View from '../view';

/**
 * Abstract base observer class. Observers are classes which listen to DOM events, do the preliminary
 * processing and fire events on the {@link module:engine/view/document~Document} objects.
 * Observers can also add features to the view, for instance by updating its status or marking elements
 * which need a refresh on DOM events.
 *
 * @abstract
 */
abstract class Observer {
	public readonly view: View;
	public readonly document: Document;
	public readonly isEnabled: false;

	/**
	 * Creates an instance of the observer.
	 *
	 * @param {module:engine/view/view~View} view
	 */
	constructor( view: View ) {
		/**
		 * An instance of the view controller.
		 *
		 * @readonly
		 * @member {module:engine/view/view~View}
		 */
		this.view = view;

		/**
		 * A reference to the {@link module:engine/view/document~Document} object.
		 *
		 * @readonly
		 * @member {module:engine/view/document~Document}
		 */
		this.document = view.document;

		/**
		 * The state of the observer. If it is disabled, no events will be fired.
		 *
		 * @readonly
		 * @member {Boolean}
		 */
		this.isEnabled = false;
	}

	/**
	 * Enables the observer. This method is called when the observer is registered to the
	 * {@link module:engine/view/view~View} and after {@link module:engine/view/view~View#forceRender rendering}
	 * (all observers are {@link #disable disabled} before rendering).
	 *
	 * A typical use case for disabling observers is that mutation observers need to be disabled for the rendering.
	 * However, a child class may not need to be disabled, so it can implement an empty method.
	 *
	 * @see module:engine/view/observer/observer~Observer#disable
	 */
	public enable(): void {
		( this as any ).isEnabled = true;
	}

	/**
	 * Disables the observer. This method is called before
	 * {@link module:engine/view/view~View#forceRender rendering} to prevent firing events during rendering.
	 *
	 * @see module:engine/view/observer/observer~Observer#enable
	 */
	public disable(): void {
		( this as any ).isEnabled = false;
	}

	/**
	 * Disables and destroys the observer, among others removes event listeners created by the observer.
	 */
	public destroy(): void {
		this.disable();
		this.stopListening();
	}

	/**
	 * Checks whether a given DOM event should be ignored (should not be turned into a synthetic view document event).
	 *
	 * Currently, an event will be ignored only if its target or any of its ancestors has the `data-cke-ignore-events` attribute.
	 * This attribute can be used inside the structures generated by
	 * {@link module:engine/view/downcastwriter~DowncastWriter#createUIElement `DowncastWriter#createUIElement()`} to ignore events
	 * fired within a UI that should be excluded from CKEditor 5's realms.
	 *
	 * @param {Node} domTarget The DOM event target to check (usually an element, sometimes a text node and
	 * potentially sometimes a document, too).
	 * @returns {Boolean} Whether this event should be ignored by the observer.
	 */
	public checkShouldIgnoreEventFromTarget( domTarget: Node ): boolean {
		if ( domTarget && domTarget.nodeType === 3 ) {
			domTarget = domTarget.parentNode as any;
		}

		if ( !domTarget || domTarget.nodeType !== 1 ) {
			return false;
		}

		return ( domTarget as any ).matches( '[data-cke-ignore-events], [data-cke-ignore-events] *' );
	}

	/**
	 * Starts observing the given root element.
	 *
	 * @method #observe
	 * @param {HTMLElement} domElement
	 * @param {String} name The name of the root element.
	 */

	public abstract observe( domElement: HTMLElement, name: string ): void;
}

mix( Observer, DomEmitterMixin );

interface Observer extends DomEmitter {}

/**
 * TODO
 * The for all all classes that inherit from Observer but excludes the abstract Observer itself.
 */
export type ObserverSubClass =
	( new ( ...args: ConstructorParameters<typeof Observer> ) => Observer ) &
	{ [ K in keyof typeof Observer ]: typeof Observer[ K ] };

export default Observer;
