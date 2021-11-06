import { pipeOperator as to } from '@pauliojanpera/pipe-operator';
import { getEncoder, getDecoder, Codec, fromCodePoint, toCodePoint } from '@pauliojanpera/byte-codecs-common';

const JsonByteCodec: Codec = {
	radix: 0x8000000, // 2^27=134217728
	enChunkSize: 27,
	deChunkSize: 32,
	overhead: 5,
	toSymbol: (source: Iterable<readonly [number, number]>) =>
		// Converts the value to a four bytes long series of UTF-8 code points.
		source[to](function* (source) {
			// Skips " and \.
			const fixIllegal = (v: number) => v + (v >= 59 ? 0x22 : v >= 2 ? 0x21 : 0x20);
			let input, inputSize;
			for ([input, inputSize] of source) {
				switch (true) {
					case input < 74805201: // 93*93*93*93
						yield fixIllegal((input / (93 * 93 * 93)) | 0);
						yield fixIllegal(((input / (93 * 93)) | 0) % 93);
						yield fixIllegal(((input / 93) | 0) % 93);
						yield fixIllegal(input % 93);
						break;
					case input < 91411281: // 93*93*1920
						input -= 74805201;
						yield fixIllegal((input / (93 * 1920)) | 0);
						yield fixIllegal(((input / 1920) | 0) % 93);
						yield (input % 1920) + 0x80;
						break;
					case input < 108017361: // 93*1920*93
						input -= 91411281;
						yield fixIllegal((input / (93 * 1920)) | 0);
						yield (((input / 93) | 0) % 1920) + 0x80;
						yield fixIllegal(input % 93);
						break;
					case input < 113921745: // 93*63488
						input -= 108017361;
						yield fixIllegal((input / 63488) | 0);
						yield (input % 63488) + 0x800;
						break;
					case input < 130527825: // 1920*93*93
						input -= 113921745;
						yield (input / (93 * 93) + 0x80) | 0;
						yield fixIllegal(((input / 93) | 0) % 93);
						yield fixIllegal(input % 93);
						break;
					case input < 134214225: // 1920*1920
						input -= 130527825;
						yield (input / 1920 + 0x80) | 0; //
						yield (input % 1920) + 0x80;
						break;
					case input < 134217728: // 63488*93
						input -= 134214225;
						yield (input / 93 + 0x800) | 0; //
						yield fixIllegal(input % 93);
						break;
					default:
						throw new Error(
							'Invalid value: ' + input.toString(16) + ' Values are capped at 2^27.'
						);
				}
			}
			if (inputSize && inputSize < JsonByteCodec.enChunkSize) {
				yield fixIllegal(inputSize);
			}
		})[to](fromCodePoint),

	fromSymbol: source =>
		source[to](toCodePoint)[to](function* (source) {
			// Skips " and \ as required by JSON string syntax.
			const fixIllegal = (v: number) => (v >= 0x5d ? v - 0x22 : v >= 0x23 ? v - 0x21 : v - 0x20);
			const getCodePointSize = (v: number) => (v < 0x80 ? 0 : v < 0x800 ? 1 : v < 0x10000 ? 2 : 3);
			const iterator = source[Symbol.iterator]();

			let inSize = 0;
			let offsetSelector = 0;
			let acc = 0;
			let done, value;
			while ((({ done, value } = iterator.next() as { done: boolean; value: number }), !done)) {
				let codePointSize = getCodePointSize(value);
				if (codePointSize === 3) {
					throw new Error(
						'Received a four byte code point. Such code points bear no meaning in this encoding.'
					);
				}
				inSize += codePointSize + 1;
				if (!codePointSize) {
					value = fixIllegal(value);
				}
				if (inSize << 3 > JsonByteCodec.deChunkSize) {
					throw new Error(
						`Too large code point for the current decoding chunk: ${value.toString(16)} (${
							codePointSize + 1
						} bytes). That would make ${inSize} bytes in total.`
					);
				}

				acc =
					acc * [93, 1920, 63488, 0][codePointSize] -
					[0, 0x80, 0x800, 0x10000][codePointSize] +
					value;

				if (inSize << 3 <= JsonByteCodec.deChunkSize) {
					offsetSelector = (offsetSelector * 3) | codePointSize;
				}

				if (inSize << 3 === JsonByteCodec.deChunkSize) {
					// Announce the size of the previous chunk.
					yield JsonByteCodec.enChunkSize;

					// Announce the value of this chunk. The values
					// are gathered from seven separate ranges which we
					// address using an offset.
					// The receiver of the yielded value will stay waiting
					// for information about the size (bit width) of the value.
					// We will deliver that on the next iteration when
					// we know if the value is the final one and if it needs
					// to be truncated to a certain bit width or not.
					yield (
						(output: number) => (_: number | undefined) =>
							output
					)(
						acc +
							[
								0, //          93*93*93*93 (0*27+0*9+0*3+0)
								74805201, //   93*93*1920  (     0*9+0*3+1)
								108017361, //  93*63488    (         0*3+2)
								91411281, //   93*1920*93  (     0*9+1*3+0)
								130527825, //  1920*1920   (         1*3+1)
								0, //          1920*63488  (         1*3+2) -> out of range
								134214225, //  63488*93    (         2*3+0)
								0, //          63488*1920  (         2*3+1) -> out of range
								0, //          63488*63488 (         2*3+2) -> out of range
								113921745, //  1920*93*93  (     1*9+0*3+0)
							][offsetSelector]
					);

					// Prepare for the next chunk.
					acc = 0;
					offsetSelector = 0;
					inSize = 0;
				}
			}

			if (inSize << 3 < JsonByteCodec.deChunkSize) {
				if (inSize === 1 && acc > 0 && acc < JsonByteCodec.enChunkSize) {
					yield acc; // Announce the truncated length of the last chunk.
				} else {
					throw new Error(
						`Unexpected end of input. InSize: ${inSize} Accumulator: 0x${acc.toString(16)}`
					);
				}
			}
		}),
};

export const encode = getEncoder(JsonByteCodec);
export const decode = getDecoder(JsonByteCodec);
