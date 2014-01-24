/**
 * 
 */
package org.opensharingtoolkit.hotspot;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

import android.util.Log;

/** Read input a line at a time and call back
 * 
 * @author pszcmg
 * 
 */
public class LineInputReader extends Thread {

	public static interface LineListener {
		public void onLine(String line);
	}
	
	private static final String TAG = "ost-hotspot";
	private BufferedReader bir;
	private boolean cancelled = false;
	private boolean done = false;
	private LineListener mLineListener;
	
	/** read all of input stream in a background thread (non-blocking).
	 * call getInput() to get the result.
	 */
	public LineInputReader(InputStream is, LineListener listener) {
		bir = new BufferedReader(new InputStreamReader(is));
		mLineListener = listener;
		start();
	}
	
	/** cancel input */
	public void cancel() {
		synchronized (this) {
			cancelled = true;
			this.notifyAll();
			this.interrupt();
		}
	}
		
	/** wait for input - blocking.
	 * @return done (not cancelled)
	 */
	public boolean waitForDone() {
		synchronized (this) {
			while (!cancelled && !done)
				try {
					this.wait();
				} catch (InterruptedException e) {
					// ignore
				}
			return done;
		}
	}
	public void run() {
		try {
			while(true) {
				synchronized (this) {
					if (cancelled)
						return;
				}
				String line = bir.readLine();
				if (line==null) {
					done();
					return;
				}
				try {
					if (mLineListener!=null)
						mLineListener.onLine(line);
				}
				catch (Exception e) {
					Log.w(TAG,"Error calling line listener with "+line, e);
				}
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
			done = true;
			this.notifyAll();
		}
	}
}
