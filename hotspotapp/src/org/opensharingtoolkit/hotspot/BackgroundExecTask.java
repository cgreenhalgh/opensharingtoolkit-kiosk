/**
 * 
 */
package org.opensharingtoolkit.hotspot;

import java.util.Arrays;

import android.util.Log;

/** Long-running background process, calling on line(s).
 * 
 * @author pszcmg
 *
 */
public class BackgroundExecTask {

	private Process mProcess;
	private LineInputReader mStderr;
	private LineInputReader mStdout;
	
	public BackgroundExecTask(LineInputReader.LineListener stdoutListener, LineInputReader.LineListener stderrListener, String... params) {
		ProcessBuilder pbuilder = new ProcessBuilder (params);
		try {
			Log.d(TAG,"Start background task: "+Arrays.toString(params));
			mProcess = pbuilder.start();
			try {
				mProcess.getOutputStream().close();
				mStderr = new LineInputReader(mProcess.getErrorStream(), stderrListener);
				mStdout = new LineInputReader(mProcess.getInputStream(), stdoutListener);
			}				
			catch (Exception e) {
				Log.w(TAG,"Error setting up streams for process "+params[0], e);
				mProcess.destroy();
				mProcess = null;
			}
		} catch (Exception e) {
			Log.w(TAG,"Error starting process "+params[0]+": "+e);
		}
	}
	
	public synchronized boolean started() {
		return mProcess!=null;
	}
	
	public synchronized void cancel() {
		if (mProcess!=null) {
			try {
				Log.w(TAG,"Try to destroy background task");
				mProcess.destroy();
				if (mStderr!=null)
					mStderr.cancel();
				if (mStdout!=null)
					mStdout.cancel();
			}
			catch (Exception e) {
				Log.w(TAG,"Error cancelling process", e);
			}
			finally {
				mProcess = null;
			}
		}
	}
	private static final String TAG = "exectask";

	@Override
	protected void finalize() throws Throwable {
		if (mProcess!=null) {
			Log.w(TAG,"Try to destroy background task on finalize");
			mProcess.destroy();
		}
		super.finalize();
	}
}
