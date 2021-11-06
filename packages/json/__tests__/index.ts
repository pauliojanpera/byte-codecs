/**
 * @jest-environment node
 */
import { encode, decode } from '../src';
import { fromCodePoint, toCodePoint } from '@pauliojanpera/byte-codecs-common';
import { pipeOperator as to } from '@pauliojanpera/pipe-operator';
import { join } from '@pauliojanpera/iterator-utils-sync';

const cases = [
	['\x00\x00\x00\x00', '        &'],
	['\x00\x00\x00\x20', '   !    &'],
	['\x00\x00\x00\x40', '   #    &'],
	['\x00\x00\x00\x60', '   $    &'],
	['\x00\x00\x00\x80', '   %    &'],
	['\x00\x00\x00\xa0', '   &    &'],
	['\x00\x00\x00\xc0', "   '    &"],
	['\x00\x00\x00\xe0', '   (    &'],
	['\x00\x00\x01\xe0', '   0    &'],
	['\x00\x00\x01\xe1', '   0   !&'],
	['\x00\x00\x01\xe1\x00', '   0  #h.'],
	['\x00', '    )'],
	['f', '  !*)'],
	['fo', ' $#|1'],
	['foo', ')A1y9'],
	['foob', 'diKQ   #&'],
	['fooba', "diKQ  'T."],
	['foobar', 'diKQ 3$Z6'],
	['Man a', 'SIaM  !%.'],
	['Man ab', "SIaM #t'6"],
	['Man abc', 'SIaM!}ME   $#'],
	['Man abcd', 'SIaM!}ME  *@+'],
	['Hello, world!!!!', 'P2Rtboz}4K~@z퍁 )Tt5'],
	['\xe3\x59\x89', '3Qba9'],
	['\x18\x5f\x3e\xa0\xe3\x59\x89\x2a\xfe\x86\x37', '0tEU%[``Qe-F   X('],
	['\x5f\x3e\xa0\xe3\x59\x89\x2a\xfe\x86\x37\x03', '`(V22LJoS׼2   $('],
	['\x3e\xa0\xe3\x59\x89\x2a\xfe\x86\x37\x03\x55', 'InI?yܭ6XGܵ   w('],
	['\u0018_> ãY\x89*þ\x867', '0tEU%[``Qe-F   X('],
	['\u0018_> ãY\x89*þ\x86', '0tEU%[``9BUc;'],
	['\u0018_> ãY\x89*þ\x866', '0tEU%[``Qe-F   W('],
	['\u0018_> ãY\x89*þ\x86\x00', '0tEU%[``Qe-F    ('],
	['\x00\x00\x00\x00\x00\x00\xc5AAAA', '       RUAN&   c('],
	['\x00\x00\x00\x00\x00\x00\xc5\x00\x00\x00\x00', '       RJdVA    ('],
	['\x00\x00\x00\x00\x00\x00\x45\x00\x00\x00\x00', '       2JdVA    ('],
	['_> ãY\x89*þ\x867\u0003', '`(V22LJoS׼2   $('],
	['> ãY\x89*þ\x867\u0003U', 'InI?yܭ6XGܵ   w('],
	[
		'\x5f\x51\x0d\x6b\xf2\xfb\x13\xba\x65\x1c\x64\x18\x5f\x3e\xa0\xe3\x59\x89\x2a\xfe\x86\x37\x03\x55\x03\x00\xde\xbd\x5c\x25\xd6\x00\x11\x61\x2c\xe7\x48\x6b\xf4\x1d\xe3\x42\x40\x8c\xb2\x5a\x05\xaf\x5a\x02\x62\xa8\x0e\x91\x5b\x25',
		"`,xv`=bt֋kam۹NѸE0cʎ413z T{ƍMøg%ۏvR$'3s鬍B}am[,b2MǾVXF~& #bu1",
	],
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
