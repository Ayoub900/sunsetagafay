using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Security.Cryptography;
using System.Security.Policy;
using System.Text;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace CmiPay
{
    public partial class Ok : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            try
            {
                String storeKey = ConfigurationManager.AppSettings["storeKey"];
                string actualHash = string.Empty;
                string retrievedHash = string.Empty;
                string order_id = string.Empty;
                string data = string.Empty;

                List<KeyValuePair<String, String>> postParams = new List<KeyValuePair<String, String>>();
                List<String> ExcludedhashParams = new List<String>();
                ExcludedhashParams.Add("encoding");
                ExcludedhashParams.Add("HASH");
                bool inListHash = true;
                data = "<table border=\"1\">";
                foreach (string key in Request.Form.AllKeys)
                {
                    data += "<tr><td>" + key + "</td><td>" + Request.Form[key] + "</td></tr>";
                    inListHash = ExcludedhashParams.Contains(key);
                    if (!inListHash)
                    {
                        KeyValuePair<String, String> newKeyValuePair = new KeyValuePair<String, String>(key, Request.Form[key]);
                        postParams.Add(newKeyValuePair);
                    }

                }
                data += "</table>";
                postParams.Sort(
         delegate (KeyValuePair<string, string> firstPair,
         KeyValuePair<string, string> nextPair)
         {
             return firstPair.Key.CompareTo(nextPair.Key.ToLower(new System.Globalization.CultureInfo("en-US", false)));
         }
     );
                String hashVal = "";
                storeKey = storeKey.Replace("\\", "\\\\").Replace("|", "\\|");

                foreach (KeyValuePair<String, String> pair in postParams)
                {
                    String escapedValue = pair.Value.Replace("\\", "\\\\").Replace("|", "\\|").Trim();
                    String lowerValue = pair.Key.ToLower(new System.Globalization.CultureInfo("en-US", false));
                    hashVal += escapedValue + "|";
                }
                hashVal += storeKey;
                actualHash = Request.Form["HASH"];
                retrievedHash = Generatehash512(hashVal);         //generating hash


                 order_id = Request.Form["oid"];       
                if (retrievedHash != actualHash)
                {
                    //Value didn't match that means some paramter value change between transaction 
                    Response.Write("<strong> Hash value did not matched </strong>");

                }
                else
                {
                    if (Request.Form["ProcReturnCode"] == "00")
                    {

                        Response.Write("<strong>Transaction  successful - Order ID : " + order_id + "</strong>");


                    }
                    else
                    {

                        Response.Write("<strong>Transaction failed - Order ID : " + order_id + "</strong>");

                    }
                    
                }

                Response.Write(data);

            }

            catch (Exception ex)
            {
                Response.Write("<span style='color:red'>" + ex.Message + "</span>");

            }
        }
        /// <summary>
        /// Generate HASH for encrypt all parameter passing while transaction
        /// </summary>
        /// <param name="text"></param>
        /// <returns></returns>
        public string Generatehash512(string text)
        {

            byte[] message = Encoding.UTF8.GetBytes(text);

            UnicodeEncoding UE = new UnicodeEncoding();
            byte[] hashValue;
            SHA512Managed hashString = new SHA512Managed();
            hashValue = hashString.ComputeHash(message);
            String hash = System.Convert.ToBase64String(hashValue);
            return hash;

        }




    }

}