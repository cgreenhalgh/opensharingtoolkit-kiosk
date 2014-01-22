package org.opensharingtoolkit.logging;
/**
 * 
 */


import org.opensharingtoolkit.logging.R;

import android.os.Bundle;
import android.preference.PreferenceActivity;

/**
 * @author pszcmg
 *
 */
public class SettingsActivity extends PreferenceActivity {

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		addPreferencesFromResource(R.xml.preferences);
	}

}
