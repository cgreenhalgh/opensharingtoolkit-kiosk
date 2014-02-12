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

/** Note: when debugging threads look like memory leaks (see http://developer.android.com/tools/debugging/index.html)
 * so i spent a while trying belt and braces to release to no avail... But hopefully it is a false
 * positive.
 * 
 * @author pszcmg
 * 
 */
public class InputReader extends Thread {

	private static final String TAG = "ost-hotspot";
	private static final long JOIN_TIMEOUT = 2000;
	private Reader bir;
	private StringBuilder sb = new StringBuilder();
	private String res;
	private boolean cancelled = false;
	
	/** read all of input stream in a background thread (non-blocking).
	 * call getInput() to get the result.
	 */
	public InputReader(InputStream is) {
		//Log.d(TAG,"Create and start InputReader");
		try {
			bir = new InputStreamReader(new BufferedInputStream(is));
		}
		catch (Exception e) {
			Log.w(TAG,"Error creating InputReader input", e);
			cancel();
		}
		start();
	}
	
	/** cancel input */
	public void cancel() {
		//Log.d(TAG,"cancel InputReader done="+(res!=null)+", cancelled="+cancelled);
		synchronized (this) {
			cancelled = true;
			this.notifyAll();
			this.interrupt();
		}
		try {
			if (bir!=null)
				bir.close();
		}
		catch (Exception e) {
			/* ignore - already recovering from a problem */
		}
		try {
			this.join(JOIN_TIMEOUT);
		}
		catch (Exception e) { /* ignore */ 
			Log.d(TAG,"cancel join timeout");
		}
	}
	
	/** wait for input - blocking.
	 * @return all input (String), else null, e.g. if cancelled
	 */
	public String getInput() {
		String rval = null;
		synchronized (this) {
			while (!cancelled && res==null)
				try {
					this.wait();
				} catch (InterruptedException e) {
					// ignore
				}
			if (cancelled)
				return null;
			// try join?!
			rval = res;
		}
		try {
			this.join(JOIN_TIMEOUT);
		}
		catch (Exception e) { /* ignore */ 
			Log.d(TAG,"getInput join timeout");
		}
		return rval;
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
		finally {
			//Log.d(TAG,"InputRead run() complete");
		}
	}
	
	private void done() {
		try {
			if (bir!=null)
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
