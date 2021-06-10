/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module find-and-replace
 */

import { uid } from 'ckeditor5/src/utils';

/**
 * Executes findCallback and updates search results list.
 */
export function updateFindResultFromRange( range, model, findCallback, results ) {
	[ ...range ].forEach( ( { type, item } ) => {
		if ( type === 'elementStart' ) {
			if ( model.schema.checkChild( item, '$text' ) ) {
				const foundItems = findCallback( {
					item,
					text: rangeToText( model.createRangeIn( item ) )
				} );

				if ( !foundItems ) {
					return;
				}

				foundItems.forEach( foundItem => {
					model.change( writer => {
						const resultId = `findResult:${ uid() }`;
						const marker = writer.addMarker( resultId, {
							usingOperation: false,
							affectsData: false,
							range: writer.createRange(
								writer.createPositionAt( item, foundItem.start ),
								writer.createPositionAt( item, foundItem.end )
							)
						} );

						const index = findInsertIndex( results, marker );

						results.add(
							{
								id: resultId,
								label: foundItem.label,
								marker
							},
							index
						);
					} );
				} );
			}
		}
	} );
}

/**
 * Returns text representation of a range. The returned text length should be the same as range length.
 * In order to achieve this this function will:
 * - replace inline elements (text-line) as new line character ("\n").
 * - @todo: check unicode characters
 */
export function rangeToText( range ) {
	return Array.from( range.getItems() ).reduce( ( rangeText, node ) => {
		// Trim text to a last occurrence of an inline element and update range start.
		if ( !( node.is( 'text' ) || node.is( 'textProxy' ) ) ) {
			// Editor has only one inline element defined in schema: `<softBreak>` which is treated as new line character in blocks.
			// Special handling might be needed for other inline elements (inline widgets).
			return `${ rangeText }\n`;
		}

		return rangeText + node.data;
	}, '' );
}

function findInsertIndex( resultsList, markerToInsert ) {
	const result = resultsList.find( ( { marker } ) => {
		return markerToInsert.getStart().isBefore( marker.getStart() );
	} );

	return result ? resultsList.getIndex( result ) : resultsList.length;
}