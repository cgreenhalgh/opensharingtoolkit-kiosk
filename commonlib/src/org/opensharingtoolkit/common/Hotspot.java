/**
 * 
 */
package org.opensharingtoolkit.common;

import android.os.Message;

/** Hotspot client helper methods.
 * 
 * @author pszcmg
 *
 */
public class Hotspot {
    /** Command to the service */
	public static final int MSG_REDIRECT_PORT = 1;
	public static final int MSG_REDIRECTED_PORT = 2;
	public static final int MSG_QUERY_CAPTIVEPORTAL = 3;
	public static final int MSG_INFORM_CAPTIVEPORTAL = 4;

	/** create message requesting port redirect */
	public static Message getRedirectPortMessage(int fromPort, int toPort) {
		Message m = Message.obtain();
		m.what = MSG_REDIRECT_PORT;
		m.arg1 = fromPort;
		m.arg2 = toPort;
		return m;
	}

	/** create message requesting port redirect */
	public static Message getRedirectedPortMessage(int fromPort, int toPort) {
		Message m = Message.obtain();
		m.what = MSG_REDIRECTED_PORT;
		m.arg1 = fromPort;
		m.arg2 = toPort;
		return m;
	}

	/** create message requesting port redirect */
	public static Message getQueryCaptiveportalMessage(boolean subscribe) {
		Message m = Message.obtain();
		m.what = MSG_QUERY_CAPTIVEPORTAL;
		m.arg1 = subscribe ? 1  : 0;
		return m;
	}

	/** create message requesting port redirect */
	public static Message getInformCaptiveportalMessage(boolean active) {
		Message m = Message.obtain();
		m.what = MSG_INFORM_CAPTIVEPORTAL;
		m.arg1 = active ? 1  : 0;
		return m;
	}
}
