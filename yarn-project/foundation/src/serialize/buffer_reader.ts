import type { Tuple } from './types.js';

/**
 * The BufferReader class provides a utility for reading various data types from a buffer.
 * It supports reading numbers, booleans, byte arrays, Fr and Fq field elements,
 * vectors, arrays, objects, strings, and maps. It maintains an internal index to
 * keep track of the current reading position in the buffer.
 *
 * Usage:
 * Create a new instance of BufferReader with a buffer and an optional offset.
 * Use the provided methods to read desired data types from the buffer.
 * The reading methods automatically advance the internal index.
 *
 * @example
 * const reader = new BufferReader(someBuffer);
 * const num = reader.readNumber();
 * const bool = reader.readBoolean();
 * const byteArray = reader.readBytes(4);
 */
export class BufferReader {
  private index: number;
  constructor(
    private buffer: Buffer,
    offset = 0,
  ) {
    this.index = offset;
  }

  /**
   * Creates a BufferReader instance from either a Buffer or an existing BufferReader.
   * If the input is a Buffer, it creates a new BufferReader with the given buffer.
   * If the input is already a BufferReader, it returns the input unchanged.
   *
   * @param bufferOrReader - A Buffer or BufferReader to initialize the BufferReader.
   * @returns An instance of BufferReader.
   */
  public static asReader(bufferOrReader: Uint8Array | Buffer | BufferReader): BufferReader {
    if (bufferOrReader instanceof BufferReader) {
      return bufferOrReader;
    }

    const buf = Buffer.isBuffer(bufferOrReader)
      ? bufferOrReader
      : Buffer.from(bufferOrReader.buffer, bufferOrReader.byteOffset, bufferOrReader.byteLength);

    return new BufferReader(buf);
  }

  /** Returns true if the underlying buffer has been consumed completely. */
  public isEmpty(): boolean {
    return this.index === this.buffer.length;
  }

  /**
   * Reads a 32-bit unsigned integer from the buffer at the current index position.
   * Updates the index position by 4 bytes after reading the number.
   *
   * @returns The read 32-bit unsigned integer value.
   */
  public readNumber(): number {
    this.#rangeCheck(4);
    this.index += 4;
    return this.buffer.readUint32BE(this.index - 4);
  }

  /**
   * Reads `count` 32-bit unsigned integers from the buffer at the current index position.
   * @param count - The number of 32-bit unsigned integers to read.
   * @returns An array of 32-bit unsigned integers.
   */
  public readNumbers<N extends number>(count: N): Tuple<number, N> {
    const result = Array.from({ length: count }, () => this.readNumber());
    return result as Tuple<number, N>;
  }

  /**
   * Reads a 256-bit unsigned integer from the buffer at the current index position.
   * Updates the index position by 32 bytes after reading the number.
   *
   * Assumes the number is stored in big-endian format.
   *
   * @returns The read 256 bit value as a bigint.
   */
  public readUInt64(): bigint {
    this.#rangeCheck(8);

    const result = this.buffer.readBigUInt64BE(this.index);

    this.index += 8;
    return result;
  }

  /**
   * Reads a 128-bit unsigned integer from the buffer at the current index position.
   * Updates the index position by 16 bytes after reading the number.
   *
   * Assumes the number is stored in big-endian format.
   *
   * @returns The read 128 bit value as a bigint.
   */
  public readUInt128(): bigint {
    this.#rangeCheck(16);

    let result = BigInt(0);
    for (let i = 0; i < 2; i++) {
      result = (result << BigInt(64)) | this.buffer.readBigUInt64BE(this.index + i * 8);
    }

    this.index += 16;
    return result;
  }

  /**
   * Reads a 256-bit unsigned integer from the buffer at the current index position.
   * Updates the index position by 32 bytes after reading the number.
   *
   * Assumes the number is stored in big-endian format.
   *
   * @returns The read 256 bit value as a bigint.
   */
  public readUInt256(): bigint {
    this.#rangeCheck(32);

    let result = BigInt(0);
    for (let i = 0; i < 4; i++) {
      result = (result << BigInt(64)) | this.buffer.readBigUInt64BE(this.index + i * 8);
    }

    this.index += 32;
    return result;
  }

  /**
   * Reads a 16-bit unsigned integer from the buffer at the current index position.
   * Updates the index position by 2 bytes after reading the number.
   *
   * @returns The read 16 bit value.
   */
  public readUInt16(): number {
    this.#rangeCheck(2);
    this.index += 2;
    return this.buffer.readUInt16BE(this.index - 2);
  }

  /**
   * Reads a 8-bit unsigned integer from the buffer at the current index position.
   * Updates the index position by 1 byte after reading the number.
   *
   * @returns The read 8 bit value.
   */
  public readUInt8(): number {
    this.#rangeCheck(1);
    this.index += 1;
    return this.buffer.readUInt8(this.index - 1);
  }

  /**
   * Reads and returns the next boolean value from the buffer.
   * Advances the internal index by 1, treating the byte at the current index as a boolean value.
   * Returns true if the byte is non-zero, false otherwise.
   *
   * @returns A boolean value representing the byte at the current index.
   */
  public readBoolean(): boolean {
    this.#rangeCheck(1);
    this.index += 1;
    return Boolean(this.buffer.at(this.index - 1));
  }

  /**
   * Reads a specified number of bytes from the buffer and returns a new Buffer containing those bytes.
   * Advances the reader's index by the number of bytes read. Throws an error if there are not enough
   * bytes left in the buffer to satisfy the requested number of bytes.
   *
   * @param n - The number of bytes to read from the buffer.
   * @returns A new Buffer containing the read bytes.
   */
  public readBytes(n: number): Buffer {
    this.#rangeCheck(n);
    this.index += n;
    return Buffer.from(this.buffer.subarray(this.index - n, this.index));
  }

  /** Reads until the end of the buffer. */
  public readToEnd(): Buffer {
    const result = this.buffer.subarray(this.index);
    this.index = this.buffer.length;
    return result;
  }

  /**
   * Reads a vector of numbers from the buffer and returns it as an array of numbers.
   * The method utilizes the 'readVector' method, passing a deserializer that reads numbers.
   *
   * @returns An array of numbers representing the vector read from the buffer.
   */
  public readNumberVector(): number[] {
    return this.readVector({
      fromBuffer: (reader: BufferReader) => reader.readNumber(),
    });
  }

  /**
   * Reads a vector of 256-bit unsigned integers from the buffer and returns it as an array of bigints.
   * The method utilizes the 'readVector' method, passing a deserializer that reads bigints.
   *
   * @returns An array of bigints representing the vector read from the buffer.
   */
  public readUint256Vector(): bigint[] {
    return this.readVector({
      fromBuffer: (reader: BufferReader) => reader.readUInt256(),
    });
  }

  /**
   * Reads a vector of fixed size from the buffer and deserializes its elements using the provided itemDeserializer object.
   * The 'itemDeserializer' object should have a 'fromBuffer' method that takes a BufferReader instance and returns the deserialized element.
   * The method first reads the size of the vector (a number) from the buffer, then iterates through its elements,
   * deserializing each one using the 'fromBuffer' method of 'itemDeserializer'.
   *
   * @param itemDeserializer - Object with 'fromBuffer' method to deserialize vector elements.
   * @returns An array of deserialized elements of type T.
   */
  public readVector<T>(itemDeserializer: {
    /**
     * A method to deserialize data from a buffer.
     */
    fromBuffer: (reader: BufferReader) => T;
  }): T[] {
    const size = this.readNumber();
    const result = new Array<T>(size);
    for (let i = 0; i < size; i++) {
      result[i] = itemDeserializer.fromBuffer(this);
    }
    return result;
  }

  /**
   * Reads a vector of fixed size from the buffer and deserializes its elements using the provided itemDeserializer object.
   * The 'itemDeserializer' object should have a 'fromBuffer' method that takes a BufferReader instance and returns the deserialized element.
   * The method first reads the size of the vector (a number) from the buffer, then iterates through its elements,
   * deserializing each one using the 'fromBuffer' method of 'itemDeserializer'.
   *
   * @param itemDeserializer - Object with 'fromBuffer' method to deserialize vector elements.
   * @returns An array of deserialized elements of type T.
   */
  public readVectorUint8Prefix<T>(itemDeserializer: {
    /**
     * A method to deserialize data from a buffer.
     */
    fromBuffer: (reader: BufferReader) => T;
  }): T[] {
    const size = this.readUInt8();
    const result = new Array<T>(size);
    for (let i = 0; i < size; i++) {
      result[i] = itemDeserializer.fromBuffer(this);
    }
    return result;
  }

  /**
   * Read an array of a fixed size with elements of type T from the buffer.
   * The 'itemDeserializer' object should have a 'fromBuffer' method that takes a BufferReader instance as input,
   * and returns an instance of the desired deserialized data type T.
   * This method will call the 'fromBuffer' method for each element in the array and return the resulting array.
   *
   * @param size - The fixed number of elements in the array.
   * @param itemDeserializer - An object with a 'fromBuffer' method to deserialize individual elements of type T.
   * @returns An array of instances of type T.
   */
  public readArray<T, N extends number>(
    size: N,
    itemDeserializer: {
      /**
       * A function for deserializing data from a BufferReader instance.
       */
      fromBuffer: (reader: BufferReader) => T;
    },
  ): Tuple<T, N> {
    const result = Array.from({ length: size }, () => itemDeserializer.fromBuffer(this));
    return result as Tuple<T, N>;
  }

  /**
   * Read a variable sized Buffer array where elements are represented by length + data.
   * The method consecutively looks for a number which is the size of the proceeding buffer,
   * then reads the bytes until it reaches the end of the reader's internal buffer.
   * NOTE: if `size` is not provided, this will run to the end of the reader's buffer.
   * @param size - Size of the buffer array in bytes (full remaining buffer length if left empty).
   * @returns An array of variable sized buffers.
   */
  public readBufferArray(size = -1): Buffer[] {
    const result: Buffer[] = [];
    const end = size >= 0 ? this.index + size : this.buffer.length;
    this.#rangeCheck(end - this.index);
    while (this.index < end) {
      const item = this.readBuffer();
      result.push(item);
    }
    // Ensure that all bytes have been read.
    if (this.index !== end) {
      throw new Error(
        `Reader buffer was not fully consumed. Consumed up to ${this.index} bytes. End of data: ${end} bytes.`,
      );
    }
    return result;
  }

  /**
   * Reads a serialized object from a buffer and returns the deserialized object using the given deserializer.
   *
   * @typeparam T - The type of the deserialized object.
   * @param deserializer - An object with a 'fromBuffer' method that takes a BufferReader instance and returns an instance of the deserialized object.
   * @returns The deserialized object of type T.
   */
  public readObject<T>(deserializer: {
    /**
     * A method that takes a BufferReader instance and returns an instance of the deserialized data type.
     */
    fromBuffer: (reader: BufferReader) => T;
  }): T {
    return deserializer.fromBuffer(this);
  }

  /**
   * Returns a Buffer containing the next n bytes from the current buffer without modifying the reader's index position.
   * If n is not provided or exceeds the remaining length of the buffer, it returns all bytes from the current position till the end of the buffer.
   *
   * @param n - The number of bytes to peek from the current buffer. (Optional).
   * @returns A Buffer with the next n bytes or the remaining bytes if n is not provided or exceeds the buffer length.
   */
  public peekBytes(n?: number): Buffer {
    this.#rangeCheck(n || 0);
    return this.buffer.subarray(this.index, n ? this.index + n : undefined);
  }

  /**
   * Reads a string from the buffer and returns it.
   * The method first reads the size of the string, then reads the corresponding
   * number of bytes from the buffer and converts them to a string.
   *
   * @returns The read string from the buffer.
   */
  public readString(): string {
    return this.readBuffer().toString();
  }

  /**
   * Reads a buffer from the current position of the reader and advances the index.
   * The method first reads the size (number) of bytes to be read, and then returns
   * a Buffer with that size containing the bytes. Useful for reading variable-length
   * binary data encoded as (size, data) format.
   *
   * @returns A Buffer containing the read bytes.
   */
  public readBuffer(): Buffer {
    const size = this.readNumber();
    this.#rangeCheck(size);
    return this.readBytes(size);
  }

  /**
   * Reads a buffer from the current position of the reader and advances the index.
   * The method first reads the size (number) of bytes to be read, and then returns
   * a Buffer with that size containing the bytes. Useful for reading variable-length
   * binary data encoded as (size, data) format.
   *
   * @returns A Buffer containing the read bytes.
   */
  public readUint8Array(): Uint8Array {
    const size = this.readNumber();
    this.#rangeCheck(size);
    return this.readBytes(size);
  }

  /**
   * Reads and constructs a map object from the current buffer using the provided deserializer.
   * The method reads the number of entries in the map, followed by iterating through each key-value pair.
   * The key is read as a string, while the value is obtained using the passed deserializer's `fromBuffer` method.
   * The resulting map object is returned, containing all the key-value pairs read from the buffer.
   *
   * @param deserializer - An object with a `fromBuffer` method to deserialize the values in the map.
   * @returns A map object with string keys and deserialized values based on the provided deserializer.
   */
  public readMap<T>(deserializer: {
    /**
     * Deserializes an element of type T from a BufferReader instance.
     */
    fromBuffer: (reader: BufferReader) => T;
  }): { [key: string]: T } {
    const numEntries = this.readNumber();
    const map: { [key: string]: T } = {};
    for (let i = 0; i < numEntries; i++) {
      const key = this.readString();
      const value = this.readObject<T>(deserializer);
      map[key] = value;
    }
    return map;
  }

  /**
   * Get the length of the reader's buffer.
   * @returns The length of the underlying reader's buffer.
   */
  public getLength(): number {
    return this.buffer.length;
  }

  /**
   * Gets bytes remaining to be read from the buffer.
   * @returns Bytes remaining to be read from the buffer.
   */
  public remainingBytes(): number {
    return this.buffer.length - this.index;
  }

  #rangeCheck(numBytes: number) {
    if (this.index + numBytes > this.buffer.length) {
      throw new Error(
        `Attempted to read beyond buffer length. Start index: ${this.index}, Num bytes to read: ${numBytes}, Buffer length: ${this.buffer.length}`,
      );
    }
  }
}

/**
 * A deserializer
 */
export interface FromBuffer<T> {
  /**
   * Deserializes an object from a buffer
   * @param buffer - The buffer to deserialize.
   */
  fromBuffer(buffer: Buffer): T;
}
