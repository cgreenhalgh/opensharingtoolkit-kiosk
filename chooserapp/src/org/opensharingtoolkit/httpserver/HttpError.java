/**
 * Copyright (c) 2012 The University of Nottingham
 * 
 *  @author Chris Greenhalgh (cmg@cs.nott.ac.uk), The University of Nottingham
 */
package org.opensharingtoolkit.httpserver;

/**
 * @author cmg
 *
 */
public class HttpError extends Exception {
	/**
	 * 
	 */
	private static final long serialVersionUID = -7084627967807287928L;
	private int status;
	private String message;
	/**
	 * @param status
	 * @param message
	 */
	public HttpError(int status, String message) {
		super(message+" ("+status+")");
		this.status = status;
		this.message = message;
	}
	/**
	 * @return the status
	 */
	public int getStatus() {
		return status;
	}
	/**
	 * @return the message
	 */
	public String getMessage() {
		return message;
	}
	public static HttpError badRequest(String msg) {
		return new HttpError(300, msg);
	}
	
}
