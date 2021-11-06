import { pipeOperator as to } from '@pauliojanpera/pipe-operator';
import { getEncoder, getDecoder, Codec, toCodePoint } from '@pauliojanpera/byte-codecs-common';

export const CookieByteCodec: Codec = {
	radix: 85,
	enChunkSize: 32,
	deChunkSize: 8,
	overhead: 8,

	toSymbol: function* (source) {
		const symbols: string[] = [
			'0','1','2','3','4','5','6','7','8','9', //
			'a','b','c','d','e','f','g','h','i','j', //
			'k','l','m','n','o','p','q','r','s','t', //
			'u','v','w','x','y','z','A','B','C','D', //
			'E','F','G','H','I','J','K','L','M','N', //
			'O','P','Q','R','S','T','U','V','W','X', //
			'Y','Z','.','-',':','+','=','^','!','/', //
			'*','?','&','<','>','(',')','[',']','{', //
			'}','@','%','$','#',
		];
		for (const [input, inputSize] of source) {
			yield symbols[input];
		}
	},
	fromSymbol: function* (source) {
		const reverseSymbols: number[] = [
			-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, //
			-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, //
			-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, //
			-1, -1, -1, 68, -1, 84, 83, 82, 72, -1, //
			75, 76, 70, 65, -1, 63, 62, 69,  0,  1, //
			 2,  3,  4,  5,  6,  7,  8,  9, 64, -1, //
			73, 66, 74, 71, 81, 36, 37, 38, 39, 40, //
			41, 42, 43, 44, 45, 46, 47, 48, 49, 50, //
			51, 52, 53, 54, 55, 56, 57, 58, 59, 60, //
			61, 77, -1, 78, 67, -1, -1, 10, 11, 12, //
			13, 14, 15, 16, 17, 18, 19, 20, 21, 22, //
			23, 24, 25, 26, 27, 28, 29, 30, 31, 32, //
			33, 34, 35, 79, -1, 80, -1, -1,
		];

		const iterator = source[to](toCodePoint)[Symbol.iterator]();
			let { done, value } = iterator.next() as { done: boolean; value: number };
			while(!done) {
				let bitCount = -8;
				while (!done && bitCount < CookieByteCodec.enChunkSize) {
					yield (value => (acc: number | undefined) => {
						return (acc || 0) * CookieByteCodec.radix + reverseSymbols[value];
					})(value);

					bitCount += 8;
					({done, value} = iterator.next() as { done: boolean; value: number });
				}
				yield bitCount;
			}
	},
};

// ((s, e=s.split(''))=>`export const Z85 : Codec = { chunkSize: 4, overhead: 1, encoding:  ["${e.join('","')}"], decoding: [${Array.from({ length: 128 }, (_, i) => s.indexOf(String.fromCharCode(i)))}] };`)('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#')

export const encode = getEncoder(CookieByteCodec);
export const decode = getDecoder(CookieByteCodec);
