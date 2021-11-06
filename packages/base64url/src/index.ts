import { pipeOperator as to } from '@pauliojanpera/pipe-operator';
import { getEncoder, getDecoder, Codec, toCodePoint } from '@pauliojanpera/byte-codecs-common';

export const Base64UrlCodec: Codec = {
	radix: 64,
	enChunkSize: 24,
	deChunkSize: 8,
	overhead: 8,
	toSymbol: function* (source) {
		const symbols: string[] = [
			'A','B','C','D','E','F','G','H','I','J',
			'K','L','M','N','O','P','Q','R','S','T',
			'U','V','W','X','Y','Z','a','b','c','d',
			'e','f','g','h','i','j','k','l','m','n',
			'o','p','q','r','s','t','u','v','w','x',
			'y','z','0','1','2','3','4','5','6','7',
			'8','9','-','_',
		];
		for (const [input, inputSize] of source) {
			yield symbols[input];
		}
	},
	fromSymbol: function* (source) {
		const reverseSymbols: number[] = [
				-1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
				-1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
				-1, -1,	-1, -1, -1, -1, -1, -1, -1, -1,
				-1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
				-1, -1, -1, -1, -1, 62, -1, -1, 52, 53,
				54, 55, 56, 57, 58, 59, 60, 61, -1, -1,
				-1, -1, -1, -1, -1,  0,	 1,	 2,  3,  4,
				 5,	 6,  7,  8,  9, 10, 11, 12, 13, 14,
				15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
				25, -1, -1, -1, -1, 63, -1, 26, 27, 28,
				29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
				39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
				49, 50, 51, -1, -1, -1, -1, -1,
		];

		let bitCount = -8;
		for(const value of source[to](toCodePoint)) {
			if(bitCount < Base64UrlCodec.enChunkSize) {
				bitCount += 8;
			} else {
				yield bitCount;
				bitCount = 0;
			}
			yield (acc:number|undefined) => (((acc||0) << 6) | reverseSymbols[value||0])>>>0;
		}
		if(bitCount>0) {
			yield bitCount;
		}

	},
};

export const encode = getEncoder(Base64UrlCodec);
export const decode = getDecoder(Base64UrlCodec);

// ((s, e=s.split(''))=>`export const Base64url : Codec = { radix: 64, enChunkSize: 24, deChunkSize: 8, overhead: 8, symbols:  ["${e.join('","')}"], reverseSymbols: [${Array.from({ length: 128 }, (_, i) => s.indexOf(String.fromCharCode(i)))}] };`)('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_')
