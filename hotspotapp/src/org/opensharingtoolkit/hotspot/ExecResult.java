/**
 * 
 */
package org.opensharingtoolkit.hotspot;

/**
 * @author pszcmg
 *
 */
public class ExecResult {
	private boolean success;
	private int exitValue;
	private String stdout;
	private String stderr;
	/**
	 * @param success
	 * @param exitValue
	 * @param stdout
	 * @param stderr
	 */
	public ExecResult(boolean success, int exitValue, String stdout,
			String stderr) {
		this.success = success;
		this.exitValue = exitValue;
		this.stdout = stdout;
		this.stderr = stderr;
	}
	/**
	 * @return the success
	 */
	public boolean isSuccess() {
		return success;
	}
	/**
	 * @return the exitValue
	 */
	public int getExitValue() {
		return exitValue;
	}
	/**
	 * @return the stdout
	 */
	public String getStdout() {
		return stdout;
	}
	/**
	 * @return the stderr
	 */
	public String getStderr() {
		return stderr;
	}
	/* (non-Javadoc)
	 * @see java.lang.Object#toString()
	 */
	@Override
	public String toString() {
		return "ExecResult [success=" + success + ", exitValue=" + exitValue
				+ ", stdout=" + stdout + ", stderr=" + stderr + "]";
	}
	
}
