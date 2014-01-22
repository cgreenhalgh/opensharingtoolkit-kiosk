/**
 * 
 */
package org.opensharingtoolkit.common;

import java.lang.ref.WeakReference;

import android.content.Context;
import android.util.Log;

/**
 * @author pszcmg
 *
 */
public class Recorder {
	private static final String TAG = "recorder";
	private WeakReference<Context> mContext;
	private String mComponent;
	/**
	 * @param mContext
	 * @param mComponent
	 */
	public Recorder(Context mContext, String mComponent) {
		super();
		this.mContext = new WeakReference<Context>(mContext);
		this.mComponent = mComponent;
	}
	public void t(String event, Object info) {
		log(Record.LEVEL_TRACE, event, info);
	}
	public void d(String event, Object info) {
		log(Record.LEVEL_DEBUG, event, info);
	}
	public void i(String event, Object info) {
		log(Record.LEVEL_INFO, event, info);
	}
	public void w(String event, Object info) {
		log(Record.LEVEL_WARN, event, info);
	}
	public void e(String component, String event, Object info) {
		log(Record.LEVEL_ERROR, event, info);
	}
	public void s(String event, Object info) {
		log(Record.LEVEL_SEVERE, event, info);
	}
	public void log(int level, String event, Object oinfo) {
		Context c = mContext.get();
		if (c!=null)
			Record.log(c, level, mComponent, event, oinfo);
		else
			Log.w(TAG,"Recorder.log with null context for "+mComponent+":"+event);
	}

	
}
