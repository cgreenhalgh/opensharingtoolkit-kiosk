/**
 * 
 */
package org.opensharingtoolkit.kiosk;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Enumeration;
import java.util.LinkedList;
import java.util.List;

import android.util.Log;
import android.webkit.JavascriptInterface;

/** Helper functions for javascript in Kiosk.
 * 
 * @author pszcmg
 *
 */
public class JavascriptHelper {
	private static final String TAG = "JavascriptHelper";

	/** get local IP address/domain name for use in URLs by other machines on network;
	 * most likely wireless 
	 * 
	 * @return IP address (as string)
	 */
	@JavascriptInterface
	public String getHostAddress() {
		Enumeration<NetworkInterface> nis;
		try {
			nis = NetworkInterface.getNetworkInterfaces();
		} catch (SocketException e) {
			Log.e(TAG,"getHostAddress could not getNetworkInterfaces: "+e.getMessage(), e);
			return "127.0.0.1";
		}
		LinkedList<NetworkInterface> bestnis = new LinkedList<NetworkInterface>();
		// order best?!
		while (nis.hasMoreElements()) {
			NetworkInterface ni = nis.nextElement();
			String name = ni.getName().toLowerCase();
			if (name.startsWith("lo")) {
				Log.d(TAG, "skip loopback interface "+name);
				continue;
			}
			if (name.startsWith("w")) 
				bestnis.addFirst(ni);
			else
				bestnis.addLast(ni);
		}
		for (NetworkInterface ni : bestnis) {
			// IPv4 only for now?!
			List<InterfaceAddress> ias = ni.getInterfaceAddresses();
			for (InterfaceAddress ia : ias) {
				InetAddress addr = ia.getAddress();
				if (addr.isLoopbackAddress())
					continue;
				if (addr.isMulticastAddress())
					continue;
				if (addr instanceof Inet4Address)
					return addr.getHostAddress();
			}
			Log.d(TAG,"Could not find useful address for interface "+ni.getName());
		}
		Log.w(TAG,"Could not find useful local IP address - using loopback");
		return "127.0.0.1";
	}
}
