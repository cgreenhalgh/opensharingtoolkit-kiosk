/**
 * 
 */
package org.opensharingtoolkit.hotspot;

import java.util.Arrays;
import java.util.List;
import java.util.Vector;

import android.util.Log;

/** I'm finding it hard to kill a background task (iwevent).
 * So on re-start I'll try to ensure it isn't still going.
 * 
 * @author pszcmg
 *
 */
public class TaskKiller {
	private static final String TAG = "taskkiller";

	public static void killTask(String processName, boolean asRoot) {
		Log.d(TAG,"killTask "+processName+" "+(asRoot ? "as root" : ""));
		ExecResult ps = ExecTask.exec("ps");
		if (!ps.isSuccess()) {
			Log.e(TAG,"ps failed :-(");
			return;
		}
		String lines[] = ps.getStdout().split("\n");
		for (String line : lines) {
			List<String> words = Arrays.asList(line.split("\\s+"));
			//Log.d(TAG,"ps: "+line+" ("+words.toString()+")");
			int ix = words.indexOf(processName);
			if (ix>=0) {
				// PID should be second column
				String pid = words.get(1);
				Log.w(TAG,"Attempt to kill process "+pid+": "+line);
				ExecResult kr = asRoot ? ExecTask.exec("su","-c","kill "+pid) : ExecTask.exec("kill",pid);
				if (kr.isSuccess())
					Log.i(TAG,"Kill returned success for "+pid);
				else
					Log.w(TAG,"Kill returned error "+kr.getExitValue()+" for "+pid);
			}
		}
	}
}
