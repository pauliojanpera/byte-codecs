/**
 * @jest-environment node
 */
import { encode, decode } from '../src';
import { fromCodePoint, toCodePoint } from '@pauliojanpera/byte-codecs-common';
import { pipeOperator as to } from '@pauliojanpera/pipe-operator';
import { join } from '@pauliojanpera/iterator-utils-sync';

const cases = [
	['foobar', 'Zm9vYmFy'],
	['Man a', 'TWFuCBh'],
	['Man ab', 'TWFuIGFi'],
	['Man abc', 'TWFuIGFiBj'],
	['Man abcd', 'TWFuIGFiGNk'],
	['Hello, world!!!!', 'SGVsbG8sIHdvcmxkISEhAh']
];

for (const [original, encoded] of cases) {
	test(`${JSON.stringify(original)} -> ${JSON.stringify(encoded)}`, () => {
		const encodingPipeline = (source: string) =>
			source[to](toCodePoint) //
				[to](encode) //
				[to](join);

		expect(encodingPipeline(original)).toEqual(encoded);
	});
	test(`${JSON.stringify(original)} <- "${encoded}"`, () => {
		const decodingPipeline = (source: string) =>
			source[to](decode) //
				[to](fromCodePoint) //
				[to](join);

		expect(decodingPipeline(encoded)).toEqual(original);
	});
}
