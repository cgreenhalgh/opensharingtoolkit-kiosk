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
    /** Command to the service to display a message */
	public static final int MSG_REDIRECT_PORT = 1;
	public static final int MSG_REDIRECTED_PORT = 2;

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

}
