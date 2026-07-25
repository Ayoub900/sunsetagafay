using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Xml.Linq;
using static System.Net.Mime.MediaTypeNames;
using System.IO;
using System.Text.RegularExpressions;
using System.Globalization;
using static System.Collections.Specialized.BitVector32;
using System.Collections;
using System.Net.NetworkInformation;


namespace CmiPay
{
    public partial class PaymentRequest : System.Web.UI.Page
    {
        public string action1 = string.Empty;
        public string hash1 = string.Empty;
        public string oid1 = string.Empty;

        protected void Page_Load(object sender, EventArgs e)
        {
            try
            {


                //set merchant id from web.config or AppSettings
                clientid.Value = ConfigurationManager.AppSettings["clientId"];
                okUrl.Value = ConfigurationManager.AppSettings["okUrl"];
                failUrl.Value = ConfigurationManager.AppSettings["failUrl"];
                shopurl.Value = ConfigurationManager.AppSettings["shopurl"];
                callbackUrl.Value = ConfigurationManager.AppSettings["callbackUrl"];
                Random rnd1 = new Random();
                rnd.Value = Generatehash512(rnd1.ToString() + DateTime.Now).ToString().Substring(0, 20);

                if (!IsPostBack)
                {
                    frmError.Visible = false; // error form
                }
                else
                {
                    //frmError.Visible = true;
                }
                if (string.IsNullOrEmpty(Request.Form["hash"]))
                {
                    submit.Visible = true;
                }
                else
                {
                    submit.Visible = false;
                }

            }
            catch (Exception ex)
            {
                Response.Write("<span style='color:red'>" + ex.Message + "</span>");

            }

        }


     
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




        protected void Button1_Click(object sender, EventArgs e)
        {
            try
            {

                string hash_string = string.Empty;


                if (string.IsNullOrEmpty(Request.Form["oid"])) // generating oid
                {
                    Random rnd = new Random();
                    string strHash = Generatehash512(rnd.ToString() + DateTime.Now);
                    oid1 = strHash.ToString().Substring(0, 20);

                }
                else
                {
                    oid1 = Request.Form["oid"];
                }
                if (string.IsNullOrEmpty(Request.Form["hash"])) // generating hash value
                {
                    if (
                        string.IsNullOrEmpty(ConfigurationManager.AppSettings["clientId"]) ||
                        string.IsNullOrEmpty(oid1) ||
                        string.IsNullOrEmpty(Request.Form["amount"]) ||
                        string.IsNullOrEmpty(Request.Form["BillToName"]) ||
                        string.IsNullOrEmpty(Request.Form["email"])
                        )
                    {
                        //error

                        frmError.Visible = true;
                        return;
                    }

                    else
                    {
                        frmError.Visible = false;
                        String storeKey = ConfigurationManager.AppSettings["storeKey"];

                        List<KeyValuePair<String, String>> postParams = new List<KeyValuePair<String, String>>();
                        List<String> ExcludedhashParams = new List<String>();
                        ExcludedhashParams.Add("encoding");
                        ExcludedhashParams.Add("hash");
                        ExcludedhashParams.Add("submit");
                        ExcludedhashParams.Add("__VIEWSTATE");
                        ExcludedhashParams.Add("__EVENTVALIDATION");
                        ExcludedhashParams.Add("__VIEWSTATEGENERATOR");
                        bool inListHash = true;
                        List<String> paramsCleared = new List<String>();
                        paramsCleared.Add("BillToName");
                        paramsCleared.Add("BillToCompany");
                        paramsCleared.Add("BillToStreet1");
                        paramsCleared.Add("BillToCity");
                        paramsCleared.Add("BillToStateProv");
                        paramsCleared.Add("BillToPostalCode");
                        paramsCleared.Add("BillToCountry");
                        bool isParamClear = true;
                        foreach (string key in Request.Form.AllKeys)
                        {
                            inListHash = ExcludedhashParams.Contains(key);
                            if (!inListHash)
                            {
                                KeyValuePair<String, String> newKeyValuePair = new KeyValuePair<String, String>(key, Request.Form[key]);
                                postParams.Add(newKeyValuePair);
                            }

                        }
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
                            isParamClear = paramsCleared.Contains(pair.Key);
                            string pairValue = pair.Value;
                            if (!isParamClear)
                            {
                                pairValue = pair.Value;
                            }
                            else
                            {
                                pairValue = RemoveSpecialCharacters(pair.Value);                              


                            }

                            String escapedValue = pairValue.Replace("\\", "\\\\").Replace("|", "\\|").Trim();
                            String lowerValue = pairValue.ToLower(new System.Globalization.CultureInfo("en-US", false));
                            if (pair.Key == "oid")
                            {
                                hashVal += oid1 + "|";
                            }
                            else
                            {
                                hashVal += escapedValue + "|";
                            }
                        }
                        hashVal += storeKey;


                        hash1 = Generatehash512(hashVal);
                        action1 = ConfigurationManager.AppSettings["gateway_Url"];// setting URL

                    }


                }

                else if (!string.IsNullOrEmpty(Request.Form["hash"]))
                {
                    hash1 = Request.Form["hash"];
                    action1 = ConfigurationManager.AppSettings["gateway_Url"];

                }




                if (!string.IsNullOrEmpty(hash1))
                {
                    hash.Value = hash1;
                    oid.Value = oid1;

                    System.Collections.Hashtable data = new System.Collections.Hashtable(); // adding values in gash table for data post
                    List<String> ExcludedParam = new List<String>();
                    ExcludedParam.Add("oid");
                    ExcludedParam.Add("hash");
                    ExcludedParam.Add("submit");
                    ExcludedParam.Add("__VIEWSTATE");
                    ExcludedParam.Add("__EVENTVALIDATION");
                    ExcludedParam.Add("__VIEWSTATEGENERATOR");
                    bool inList = true;
                    List<String> paramsClear = new List<String>();
                    paramsClear.Add("BillToName");
                    paramsClear.Add("BillToCompany");
                    paramsClear.Add("BillToStreet1");
                    paramsClear.Add("BillToCity");
                    paramsClear.Add("BillToStateProv");
                    paramsClear.Add("BillToPostalCode");
                    paramsClear.Add("BillToCountry");
                    bool isParamsClear = true;

                    foreach (string key in Request.Form.AllKeys)
                    {
                        inList = ExcludedParam.Contains(key);
                        isParamsClear = paramsClear.Contains(key);
                        if (!inList)
                        {
                            if (!isParamsClear)
                            {
                                data.Add(key, Request.Form[key]);
                            } else
                            {
                                data.Add(key, RemoveSpecialCharacters(Request.Form[key]).Trim());
                            }
                        }
                        

                    }
                    data.Add("oid", oid.Value);
                    data.Add("hash", hash.Value);
                    string strForm = PreparePOSTForm(action1, data);
                    Page.Controls.Add(new LiteralControl(strForm));

                }

                else
                {
                    //no hash

                }

            }

            catch (Exception ex)
            {
                Response.Write("<span style='color:red'>" + ex.Message + "</span>");

            }



        }
        private string PreparePOSTForm(string url, System.Collections.Hashtable data)      // post form
        {
            
            //Set a name for the form
            string formID = "PostForm";
            //Build the form using the specified data to be posted.
            StringBuilder strForm = new StringBuilder();
            strForm.Append("<form id=\"" + formID + "\" name=\"" +
                           formID + "\" action=\"" + url +
                           "\" method=\"POST\">");

            foreach (System.Collections.DictionaryEntry key in data)
            {

                strForm.Append("<input type=\"hidden\" name=\"" + key.Key +
                               "\" value=\"" + key.Value + "\">");
            }
            strForm.Append("</form>");
            //Build the JavaScript which will do the Posting operation.
            StringBuilder strScript = new StringBuilder();
            strScript.Append("<script language='javascript'>");
            strScript.Append("var v" + formID + " = document." +
                             formID + ";");
            strScript.Append("v" + formID + ".submit();");
            strScript.Append("</script>");
            //Return the form and the script concatenated.
            //(The order is important, Form then JavaScript)
            return strForm.ToString() + strScript.ToString();
        }
        public static string RemoveSpecialCharacters(string str)
        {
            return Regex.Replace(str, "[^0-9A-Za-z _-]", "");
        }


    }
}