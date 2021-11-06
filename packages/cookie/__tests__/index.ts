/**
 * @jest-environment node
 */
import { encode, decode } from '../src';
import { fromCodePoint, toCodePoint } from '@pauliojanpera/byte-codecs-common';
import { pipeOperator as to } from '@pauliojanpera/pipe-operator';
import { join } from '@pauliojanpera/iterator-utils-sync';

const cases = [
	['foobar', 'w]zP%3CF'],
	['Man ', 'o<}]Z'],
	['Man a', 'o<}]Z1c'],
	['Man ab', 'o<}]Z3Cp'],
	['Man abc', 'o<}]ZaxtD'],
	['Man abcd', 'o<}]ZvpA.S'],
	['Hello, world!!!!', 'nm=QNz.92Pz/PV8aT50L'],
];

for (const [original, encoded] of cases) {
	test(`${JSON.stringify(original)} -> ${JSON.stringify(encoded)}`, () => {
		const encodingPipeline = (source: Iterable<string>) =>
			source[to](toCodePoint) //
				[to](encode) //
				[to](join);

		expect(encodingPipeline(original[Symbol.iterator]())).toEqual(encoded);
	});
	test(`${JSON.stringify(original)} <- "${encoded}"`, () => {
		const decodingPipeline = (source: Iterable<string>) =>
			source[to](decode) //
				[to](fromCodePoint) //
				[to](join);

		expect(decodingPipeline(encoded as unknown as Iterable<string>)).toEqual(original);
	});
}
