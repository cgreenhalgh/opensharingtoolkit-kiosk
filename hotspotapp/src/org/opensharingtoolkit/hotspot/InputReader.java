/**
 * 
 */
package org.opensharingtoolkit.hotspot;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

import android.util.Log;

/**
 * @author pszcmg
 * 
 */
public class InputReader extends Thread {

	private static final String TAG = "ost-hotspot";
	private Reader bir;
	private StringBuilder sb = new StringBuilder();
	private String res;
	private boolean cancelled = false;
	
	/** read all of input stream in a background thread (non-blocking).
	 * call getInput() to get the result.
	 */
	public InputReader(InputStream is) {
		bir = new InputStreamReader(new BufferedInputStream(is));
		start();
	}
	
	/** cancel input */
	public void cancel() {
		synchronized (this) {
			cancelled = true;
			this.notifyAll();
			this.interrupt();
		}
		try {
			bir.close();
		}
		catch (Exception e) {
			/* ignore - already recovering from a problem */
		}
	}
	
	/** wait for input - blocking.
	 * @return all input (String), else null, e.g. if cancelled
	 */
	public String getInput() {
		synchronized (this) {
			while (!cancelled && res==null)
				try {
					this.wait();
				} catch (InterruptedException e) {
					// ignore
				}
			if (cancelled)
				return null;
			return res;
		}
	}
	
	public void run() {
		char buffer [] = new char[10000];
		try {
			while(true) {
				synchronized (this) {
					if (cancelled)
						return;
				}
				int cnt = bir.read(buffer);
				if (cnt<0) {
					done();
					return;
				}
				sb.append(buffer, 0, cnt);
			}
		} catch (IOException e) {
			Log.d(TAG,"InputReader error: "+e, e);
			done();
		}
	}
	
	private void done() {
		try {
			bir.close();
		}
		catch (Exception e) {
			/* ignore */
		}
		synchronized (this) {
			res = sb.toString();
			this.notifyAll();
		}
	}
}
