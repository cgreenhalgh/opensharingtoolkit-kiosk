/**
 * 
 */
package org.opensharingtoolkit.hotspot;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import android.util.Log;

/** iptables utilities.
 * 
 * @author pszcmg
 *
 */
public class Iptables {
	private static final String TAG = "iptables";

	/* Some sample commands and output:
root@deb:/ # iptables -t nat -n --line-numbers -L PREROUTING                   
Chain PREROUTING (policy ACCEPT)
num  target     prot opt source               destination         
1    oem_nat_pre  all  --  0.0.0.0/0            0.0.0.0/0           
2    REDIRECT   tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:80 redir ports 8080

# iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080

# iptables -t nat -D PREROUTING 2

 */
	private static class Redirect {
		int fromPort;
		int toPort;
		int num;
		boolean udp;
		/* (non-Javadoc)
		 * @see java.lang.Object#toString()
		 */
		@Override
		public String toString() {
			return "Redirect [fromPort=" + fromPort + ", toPort=" + toPort
					+ ", num=" + num + ", udp=" + udp + "]";
		}
	}
	/** redirect all transiting TCP packets address to fromPort to the local IP and to TCP port toPort.
	 * 
	 * @param fromPort
	 * @param toPort
	 * @return
	 */
	public static boolean redirectPort(int fromPort, int toPort, boolean udp) {
		Redirect nowPort = findRedirectForPort(fromPort, udp);
		if (nowPort==null || nowPort.toPort!=toPort) {
			if (nowPort!=null) {
				while (nowPort!=null && removeRedirect(nowPort))
					nowPort = findRedirectForPort(fromPort, udp);
			}
			addRedirectPort(fromPort, toPort, udp);
			nowPort = findRedirectForPort(fromPort, udp);
			if (nowPort==null || nowPort.toPort!=toPort) 
				Log.e(TAG,"Could not set up redirect "+fromPort+" -> "+toPort+" (now "+nowPort+") udp="+udp);
			else
				Log.i(TAG,"Success redirect "+fromPort+" -> "+toPort+" (now "+nowPort+") udp="+udp);
				
		}
		return nowPort!=null && nowPort.toPort==toPort;
	}
	/** remove any/all redirect for fromPort.
	 * 
	 * @param fromPort
	 * @param toPort
	 * @return
	 */
	public static void removeRedirect(int fromPort, boolean udp) {
		Redirect nowPort = findRedirectForPort(fromPort, udp);
		while (nowPort!=null && removeRedirect(nowPort))
			nowPort = findRedirectForPort(fromPort, udp);
	}
	
	private static boolean removeRedirect(Redirect nowPort) {
		if (nowPort!=null) {
			Log.i(TAG,"Attempt iptables removeRedirect num "+nowPort.num);
			return ExecTask.exec("su","-c","iptables -t nat -D PREROUTING "+nowPort.num).isSuccess();
		}
		return false;
	}

	private static void addRedirectPort(int fromPort, int toPort, boolean udp) {
		Log.i(TAG,"Attempt iptables addRedirectPort "+fromPort+" -> "+toPort);
		if (udp)
			ExecTask.exec("su","-c","iptables -t nat -A PREROUTING -p udp --dport "+fromPort+" -j REDIRECT --to-port "+toPort);  
		else
			ExecTask.exec("su","-c","iptables -t nat -A PREROUTING -p tcp --dport "+fromPort+" -j REDIRECT --to-port "+toPort);  
	}
	
	/** like: 2    REDIRECT   tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:80 redir ports 8080
     */
	private static Pattern redirectPattern = Pattern.compile("^(\\d+)\\s+REDIRECT\\s+tcp\\s.*tcp\\s+dpt:(\\d+)\\s+redir\\s+ports\\s+(\\d+)\\s*");
	private static Pattern redirectUdpPattern = Pattern.compile("^(\\d+)\\s+REDIRECT\\s+udp\\s.*udp\\s+dpt:(\\d+)\\s+redir\\s+ports\\s+(\\d+)\\s*");

	/** try to check if redirect exists for destination (from) port.
	 * @param udp 
	 * 
	 * @return port redirected to, or 0 if not found
	 */
	private static Redirect findRedirectForPort(int fromPort, boolean udp) {
		Log.i(TAG,"Attempt iptables findRedirectForPort");
		ExecResult res = ExecTask.exec("su","-c","iptables -t nat -n --line-numbers -L PREROUTING");
		if (res.isSuccess()) {
			String lines[] = res.getStdout().split("\n");
			for (int i=0; i<lines.length; i++){
				Matcher m = (udp ? redirectUdpPattern : redirectPattern).matcher(lines[i]);
				if (m.matches()) {
					Log.d(TAG,"Found Redirect "+m.group(1)+" "+m.group(2)+" -> "+m.group(3)+" udp="+udp);
					try {
						Redirect r = new Redirect();
						r.fromPort = Integer.parseInt(m.group(2));
						r.num = Integer.parseInt(m.group(1));
						r.toPort = Integer.parseInt(m.group(3));
						r.udp = udp;
						
						if (r.fromPort == fromPort)
							return r;
					}
					catch (Exception e) {
						Log.e(TAG,"Error parsing iptables output "+lines[i], e);
					}
				}
				else
					Log.d(TAG,"iptables output unmatched: "+lines[i]);
			}
		}
		return null;
	}
}
