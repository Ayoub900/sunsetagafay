Imports System.Configuration
Imports System.Web
Imports System.Web.Security
Imports System.Web.UI
Imports System.Web.UI.WebControls
Imports System.Web.UI.WebControls.WebParts
Imports System.Web.UI.HtmlControls
Imports System.Security.Cryptography
Imports System.Text

Public Class Ok
    Inherits System.Web.UI.Page

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        Try
            Dim storekey As String = ConfigurationManager.AppSettings("storekey")

            Dim sortedList As New SortedList()
            Dim Data As String = "<table border='1'>"
            For Each paramName As String In Request.Form.AllKeys
                sortedList.Add(paramName, Request.Form(paramName))
                Data += "<tr><td>" + paramName + "</td><td>" + Request.Form(paramName) + "</td></tr>"
            Next
            Data += "</table>"
            Dim hashval As String = ""

            Dim i As Integer
            For i = 0 To sortedList.Count - 1
                Dim lowerKey As String = sortedList.GetKey(i).ToString.ToLower()
                If (Not lowerKey.Equals("hash") And Not lowerKey.Equals("encoding")) Then
                    hashval += sortedList.GetByIndex(i) + "|"
                End If
            Next i



            storekey = storekey.Replace("\", "\\").Replace("|", "\|")
            hashval += storekey
            Dim actualHash As String = Request.Form("HASH")
            Dim retrievedHash As String = Generatehash512(hashval)

            If (Not retrievedHash.Equals(actualHash)) Then
                Response.Write("<h4>Security Alert. The digital signature is not valid.</h4>")
            Else
                Response.Write("<h4>HASH is Successfull</h4>")
                If (Request.Form("ProcReturnCode").Equals("00")) Then
                    Response.Write("<strong>Transaction  successful - Order ID : " + Request.Form("oid") + "</strong>")
                Else
                    Response.Write("<strong>Transaction failed - Order ID : " + Request.Form("oid") + "</strong>")
                End If
            End If
            Response.Write(Data)
        Catch ex As Exception

            Response.Write("<span style='color:red'>" & ex.Message & "</span>")
        End Try
    End Sub

    Public Function Generatehash512(ByVal text As String) As String

        Dim message As Byte() = Encoding.UTF8.GetBytes(text)

        Dim UE As New UnicodeEncoding()
        Dim hashValue As Byte()
        Dim hashString As New SHA512Managed()
        Dim hex As String = ""
        hashValue = hashString.ComputeHash(message)
        Dim hash As String = Convert.ToBase64String(hashValue)
        Return hash

    End Function






End Class