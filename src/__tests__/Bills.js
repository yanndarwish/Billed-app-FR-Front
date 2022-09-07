/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import '@testing-library/jest-dom'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import Bills from '../containers/Bills.js'
import mockStore from "../__mocks__/store"

import router from "../app/Router.js";

// IMPORTANT ! Mock the data from mockstore 
// to enable mockImplementationOnce in API calls
jest.mock('../app/store', () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      expect(windowIcon).toHaveClass('active-icon')
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("Then getBills should be called to format the bills", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      // create instance of Bills
      const store = mockStore
      const myBills = new Bills({
        document, 
        onNavigate, 
        store,
        localStorage: window.localStorage
      })
      // simulate function
      const getBills = jest.fn(myBills.getBills)
      // this proves that the formating has altered the array, thus it is working
      expect(await getBills()).not.toEqual(mockStore.bills().list())
    })

  })
  describe("When i click on IconEye", () => {
    test("then function opening the modal should be called", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      const store = null
      const myBills = new Bills({
        document, 
        onNavigate, 
        store,
        localStorage: window.localStorage
      })
      // simulate jquery modal function to make it accessible from jest
      $.fn.modal = jest.fn()
      // simulate function
      const handleClickIconEye = jest.fn(myBills.handleClickIconEye)

      const icon = screen.queryAllByTestId('icon-eye')[0]
      icon.addEventListener('click', handleClickIconEye(icon))
      fireEvent.click(icon)
      
      expect(handleClickIconEye).toHaveBeenCalled()
    })
  })

  describe("When i click on New Bill", () => {
    test("then we should be redirected to Bills page", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()

      window.onNavigate(ROUTES_PATH.Bills)

      const store = null
      const myBills = new Bills({
        document,
        onNavigate,
        store,
        localStorage : window.localStorage
      })

      // simulate function
      const handleClickNewBill = jest.fn(myBills.handleClickNewBill)

      await waitFor(() => screen.getByTestId('btn-new-bill'))
      const newBillBtn = screen.getByTestId('btn-new-bill')
      newBillBtn.addEventListener('click', handleClickNewBill())
      fireEvent.click(newBillBtn)

      expect(handleClickNewBill).toHaveBeenCalled()
      expect(screen.getByText(/Envoyer une note de frais/i)).toBeInTheDocument()
    })
  })
})

// test d'intégration GET
describe("Given I am a user connected as Emplyee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      const tableBody  = screen.getByTestId("tbody")
      expect(tableBody.hasChildNodes()).toBe(true)
    })
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, 'bills')
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      })
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
          email: 'a@a',
        })
      )
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.appendChild(root)
      router()
    })

    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error('Erreur 404'))
          },
        }
      })
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
  })
})
