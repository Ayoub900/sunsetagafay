
Imports System.Data
Imports System.Configuration
Imports System.Web
Imports System.Web.Security
Imports System.Web.UI
Imports System.Web.UI.WebControls
Imports System.Web.UI.WebControls.WebParts
Imports System.Web.UI.HtmlControls
Imports System.Security.Cryptography
Imports System.Text
Imports System.Net
Imports System.IO
Imports System.Collections.Generic
Imports System.Text.RegularExpressions

Public Class PaymentRequest
    Inherits System.Web.UI.Page
    Public action1 As String = String.Empty
    Public hash1 As String = String.Empty
    Public oid1 As String = String.Empty
    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        Try



            clientid.Value = ConfigurationManager.AppSettings("clientId")
            okUrl.Value = ConfigurationManager.AppSettings("okUrl")
            failUrl.Value = ConfigurationManager.AppSettings("failUrl")
            shopurl.Value = ConfigurationManager.AppSettings("shopurl")
            callbackUrl.Value = ConfigurationManager.AppSettings("callbackUrl")
            Dim rnd1 As New Random()
            Rnd.Value = Generatehash512(rnd1.ToString() & DateTime.Now)

            If Not IsPostBack Then
                ' error form
                frmError.Visible = False
                'frmError.Visible = true;
            Else
            End If
            If String.IsNullOrEmpty(Request.Form("hash")) Then
                submit.Visible = True
            Else
                submit.Visible = False

            End If
        Catch ex As Exception

            Response.Write("<span style='color:red'>" & ex.Message & "</span>")
        End Try
    End Sub





    Public Function Generatehash512(ByVal text As String) As String

        Dim message As Byte() = System.Text.Encoding.UTF8.GetBytes(text)

        Dim UE As New UnicodeEncoding()
        Dim hashValue As Byte()
        Dim hashString As New SHA512Managed()
        Dim hex As String = ""
        hashValue = hashString.ComputeHash(message)
        Dim hash As String = Convert.ToBase64String(hashValue)
        Return hash

    End Function





    Protected Sub Button1_Click(ByVal sender As Object, ByVal e As EventArgs) Handles submit.Click
        Try
            Dim storekey As String = ConfigurationManager.AppSettings("storekey")
            Dim hash_string As String = String.Empty


            If String.IsNullOrEmpty(Request.Form("oid")) Then
                ' generating oid
                Dim rnd As New Random()
                Dim strHash As String = Generatehash512(rnd.ToString() & DateTime.Now)

                oid1 = strHash.ToString().Substring(0, 20)
            Else
                oid1 = Request.Form("oid")
            End If
            If String.IsNullOrEmpty(Request.Form("hash")) Then
                ' generating hash value
                If String.IsNullOrEmpty(ConfigurationManager.AppSettings("clientId")) OrElse String.IsNullOrEmpty(oid1) OrElse String.IsNullOrEmpty(Request.Form("amount")) OrElse String.IsNullOrEmpty(Request.Form("BillToName")) OrElse String.IsNullOrEmpty(Request.Form("email")) Then                    'error

                    frmError.Visible = True
                    Return
                Else

                    frmError.Visible = False
                    Dim sortedList As New SortedList()

                    Dim ExcludedhashParams As New List(Of String)
                    Dim cleanString As String
                    ExcludedhashParams.Add("encoding")
                    ExcludedhashParams.Add("hash")
                    ExcludedhashParams.Add("submit")
                    ExcludedhashParams.Add("__VIEWSTATE")
                    ExcludedhashParams.Add("__EVENTVALIDATION")
                    ExcludedhashParams.Add("__VIEWSTATEGENERATOR")
                    Dim inListHash As Boolean
                    Dim isParamClear As Boolean
                    inListHash = True
                    isParamClear = True
                    Dim paramsCleared As New List(Of String)
                    paramsCleared.Add("BillToName")
                    paramsCleared.Add("BillToCompany")
                    paramsCleared.Add("BillToStreet1")
                    paramsCleared.Add("BillToCity")
                    paramsCleared.Add("BillToStateProv")
                    paramsCleared.Add("BillToPostalCode")
                    paramsCleared.Add("BillToCountry")

                    For Each paramName As String In Request.Form.AllKeys
                        inListHash = ExcludedhashParams.Contains(paramName)
                        If (Not inListHash) Then
                            sortedList.Add(paramName, Request.Form(paramName))
                        End If
                    Next

                    Dim hashval As String = ""

                    Dim i As Integer
                    For i = 0 To sortedList.Count - 1
                        Dim lowerKey As String = sortedList.GetKey(i).ToString.ToLower()
                        isParamClear = paramsCleared.Contains(sortedList.GetKey(i).ToString)
                        If (Not isParamClear) Then
                            If (lowerKey.Equals("oid")) Then
                                hashval += oid1 + "|"
                            Else
                                hashval += sortedList.GetByIndex(i).Trim() + "|"
                            End If

                        Else
                            cleanString = Regex.Replace(sortedList.GetByIndex(i), "[^0-9A-Za-z _-]", "").Trim()
                            hashval += cleanString + "|"
                        End If
                    Next i



                    storekey = storekey.Replace("\", "\\").Replace("|", "\|")
                    hashval += storekey
                    hash1 = Generatehash512(hashval)
                    'generating hash
                    ' setting URL
                    action1 = ConfigurationManager.AppSettings("gateway_Url")


                End If

            ElseIf Not String.IsNullOrEmpty(Request.Form("hash")) Then
                hash1 = Request.Form("hash")

                action1 = ConfigurationManager.AppSettings("gateway_Url")
            End If




            If Not String.IsNullOrEmpty(hash1) Then
                hash.Value = hash1
                Oid.Value = oid1

                Dim data As New System.Collections.Hashtable()
                Dim ExcludedParam As New List(Of String)
                ExcludedParam.Add("oid")
                ExcludedParam.Add("hash")
                ExcludedParam.Add("submit")
                ExcludedParam.Add("__VIEWSTATE")
                ExcludedParam.Add("__EVENTVALIDATION")
                ExcludedParam.Add("__VIEWSTATEGENERATOR")
                Dim inList As Boolean
                Dim isParamsClear As Boolean
                Dim cleanString As String
                inList = True
                isParamsClear = True
                Dim paramsClear As New List(Of String)
                paramsClear.Add("BillToName")
                paramsClear.Add("BillToCompany")
                paramsClear.Add("BillToStreet1")
                paramsClear.Add("BillToCity")
                paramsClear.Add("BillToStateProv")
                paramsClear.Add("BillToPostalCode")
                paramsClear.Add("BillToCountry")

                For Each key As String In Request.Form.AllKeys
                    cleanString = Regex.Replace(Request.Form(key), "[^0-9A-Za-z _-]", "").Trim()

                    inList = ExcludedParam.Contains(key)
                    isParamsClear = paramsClear.Contains(key)
                    If (Not inList) Then
                        If (Not isParamsClear) Then
                            data.Add(key, Request.Form(key))
                        Else
                            data.Add(key, cleanString)
                        End If
                    End If
                Next

                data.Add("oid", Oid.Value)
                data.Add("hash", hash.Value)

                Dim strForm As String = PreparePOSTForm(action1, data)

                Page.Controls.Add(New LiteralControl(strForm))
            Else
                'no hash



            End If

        Catch ex As Exception


            Response.Write("<span style='color:red'>" & ex.Message & "</span>")
        End Try

    End Sub



    Private Function PreparePOSTForm(ByVal url As String, ByVal data As System.Collections.Hashtable) As String
        ' post form
        'Set a name for the form
        Dim formID As String = "PostForm"
        'Build the form using the specified data to be posted.
        Dim strForm As New StringBuilder()
        strForm.Append("<form id=""" & formID & """ name=""" & formID & """ action=""" & url & """ method=""POST"">")

        For Each key As System.Collections.DictionaryEntry In data

            strForm.Append("<input type=""hidden"" name=""" & Convert.ToString(key.Key) & """ value=""" & Convert.ToString(key.Value) & """>")
        Next


        strForm.Append("</form>")
        'Build the JavaScript which will do the Posting operation.
        Dim strScript As New StringBuilder()
        strScript.Append("<script language='javascript'>")
        strScript.Append("var v" & formID & " = document." & formID & ";")
        strScript.Append("v" & formID & ".submit();")
        strScript.Append("</script>")
        'Return the form and the script concatenated.
        '(The order is important, Form then JavaScript)
        Return strForm.ToString() & strScript.ToString()
    End Function





End Class