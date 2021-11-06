import { pipeOperator as to } from '@pauliojanpera/pipe-operator';

export interface Codec {
	readonly radix: number;
	readonly enChunkSize: number;
	readonly deChunkSize: number;
	readonly overhead: number;
	readonly pad?: number;
	toSymbol(source: Iterable<readonly [number, number]>): Iterable<string>;
	fromSymbol(source: Iterable<string>): Iterable<((acc: number | undefined) => number) | number>;
}

export const getEncoder = <T>({ radix, enChunkSize, deChunkSize, overhead, toSymbol }: Codec) => {
	return (source: Iterable<number>): Iterable<string> =>
		source[to](function* (source) {
			let acc = 0;
			let accSize = 0;

			const output = function* (): Generator<readonly [number, number]> {
				const outbuf: number[] = [];
				let outSize = Math.min(accSize, enChunkSize);
				for (accSize += overhead; accSize > 0; accSize -= deChunkSize) {
					outbuf.unshift(acc % radix);
					acc = (acc / radix) | 0;
				}
				for (const output of outbuf) {
					yield [output, outSize];
				}
			};

			for (let input of source) {
				let inputSize = 8;
				let missing;
				while (inputSize >= (missing = enChunkSize - accSize)) {
					acc =
						(acc << Math.min(inputSize, missing)) | (input >>> Math.max(0, inputSize - missing));
					accSize += Math.min(inputSize, missing);
					inputSize = Math.max(0, inputSize - missing);
					input &= (1 << inputSize) - 1;
					if (accSize === enChunkSize) {
						yield* output();
						acc = 0;
						accSize = 0;
					}
				}
				acc = (acc << inputSize) | input;
				accSize += inputSize;
			}
			if (accSize) {
				yield* output();
			}
		})[to](toSymbol);
};

export const getDecoder = ({ fromSymbol }: Codec) => {
	return (source: Iterable<string>): Iterable<number> =>
		source[to](fromSymbol)[to](function* (source) {
			let acc;
			let carry = 0;
			let carrySize = 0;
			for (const stepperOrChunkSize of source) {
				if (typeof stepperOrChunkSize === 'number') {
					if (acc === undefined) {
						// Ignore.
					} else {
						// a number denoting the size of the just completed chunk
						let accSize: number = stepperOrChunkSize;

						while (carrySize + accSize >= 8) {
							const shift = 8 - carrySize;
							yield (carry << shift) | (acc >> (accSize - shift));
							accSize -= shift;
							acc &= (1 << accSize) - 1;
							carry = 0;
							carrySize = 0;
						}
						carry = (carry << accSize) | acc;
						carrySize += accSize;
						acc = undefined;
					}
				} else {
					acc = stepperOrChunkSize(acc);
				}
			}
		});
};

export const toCodePoint = function* (source: Iterable<string>) {
	for (const input of source) {
		let codePoint;
		if (input.length > 1 || (codePoint = input.codePointAt(0)) === undefined) {
			throw new Error('Invalid code point.');
		}
		yield codePoint;
	}
};

export const fromCodePoint = function* (source: Iterable<number>) {
	for (const input of source) {
		yield String.fromCodePoint(input);
	}
};

