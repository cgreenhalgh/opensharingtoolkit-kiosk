/**
 * 
 */
package org.opensharingtoolkit.hotspot;

import java.io.IOException;
import java.io.InputStream;

import android.os.AsyncTask;
import android.util.Log;

/**
 * @author pszcmg
 *
 */
public class ExecTask extends AsyncTask<String, Float, ExecResult> {

	private static final String TAG = "exectask";

	/* (non-Javadoc)
	 * @see android.os.AsyncTask#doInBackground(Params[])
	 */
	@Override
	protected ExecResult doInBackground(String... params) {
		ProcessBuilder pbuilder = new ProcessBuilder (params);
		
		try {
			Process p = pbuilder.start();
			try {
				p.getOutputStream().close();
				InputReader stderr = new InputReader(p.getErrorStream());
				InputReader stdin = new InputReader(p.getInputStream());
				try {
					int exitCode = p.waitFor();
					Log.d(TAG,"Process "+params[0]+" completed with status "+exitCode);
					return new ExecResult((exitCode==0),
							exitCode,
							stdin.getInput(),
							stderr.getInput());
				} catch (InterruptedException e) {
					Log.w(TAG,"Error waiting for process "+params[0]+": "+e);
					// tidy up
					stderr.cancel();
					stdin.cancel();
				}
			}				
			finally {
				p.destroy();
			}
		} catch (IOException e) {
			Log.w(TAG,"Error starting process "+params[0]+": "+e);
		}
		return new ExecResult(false,0,null,null);
	}

}
