/**
 * Copyright (c) 2012 The University of Nottingham
 *  
 *  @author Chris Greenhalgh (cmg@cs.nott.ac.uk), The University of Nottingham
 */

package org.opensharingtoolkit.httpserver;

import java.io.InputStream;
import java.util.Map;

/**
 * @author cmg
 *
 */
public interface HttpContinuation {
	void done(int status, String message, String mimeType, long length, InputStream content, Map<String,String> extraHeaders);
}
