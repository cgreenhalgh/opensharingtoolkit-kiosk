/**
 * 
 */
package org.opensharingtoolkit.common;

/**
 * @author pszcmg
 *
 */
public enum OstLogLevel {
	Trace(0), Debug(2), Info(4), Warn(6), Error(8), Severe(10);
	
	OstLogLevel(int level) {
		this.level = level;
	}
	private int level;
	public int getLevel() { return level; }
}
