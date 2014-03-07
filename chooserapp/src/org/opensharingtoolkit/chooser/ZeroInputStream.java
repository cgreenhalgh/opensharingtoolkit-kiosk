/**
 * 
 */
package org.opensharingtoolkit.chooser;

import java.io.IOException;
import java.io.InputStream;

/** Test input stream returning 0
 * 
 * @author pszcmg
 *
 */
public class ZeroInputStream extends InputStream {

	private static final int LOTS = 1000000000;

	/* (non-Javadoc)
	 * @see java.io.InputStream#read()
	 */
	@Override
	public int read() throws IOException {
		return 0;
	}

	/* (non-Javadoc)
	 * @see java.io.InputStream#available()
	 */
	@Override
	public int available() throws IOException {
		return LOTS;
	}

	/* (non-Javadoc)
	 * @see java.io.InputStream#read(byte[], int, int)
	 */
	@Override
	public int read(byte[] buffer, int offset, int length) throws IOException {
		return length;
	}
	/* (non-Javadoc)
	 * @see java.io.InputStream#read(byte[])
	 */
	@Override
	public int read(byte[] buffer) throws IOException {
		return buffer.length;
	}

}
