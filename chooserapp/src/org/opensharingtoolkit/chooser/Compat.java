/**
 * 
 */
package org.opensharingtoolkit.chooser;

import java.io.File;
import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Build;
/**
 * @author pszcmg
 *
 */
public class Compat {
	@SuppressLint("NewApi")
	public static File getExternalFilesDir(Context context) {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.FROYO)
			// API level 7
			return context.getExternalFilesDir(null);
		else
			return context.getFilesDir();
	}
}
