"use client"
import { DatePicker } from "@ark-ui/react/date-picker"
import { Portal } from "@ark-ui/react/portal"
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react"
import { forwardRef } from "react"

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  dataTestId?: string
}

export const ModernDatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, placeholder = "Pick a date", className = "", disabled = false, dataTestId }, ref) => {
    return (
      <div className={`w-full ${className}`}>
        <DatePicker.Root 
          onValueChange={(details) => {
            if (onChange) {
              if (details.valueAsString.length > 0) {
                onChange(details.valueAsString[0]);
              } else {
                onChange(""); // Handle clear action
              }
            }
          }}
          disabled={disabled}
        >
          {/* Input + Controls */}
          <DatePicker.Control className="flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-200">
            <DatePicker.Input
              ref={ref}
              value={value || ""}
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              placeholder={placeholder}
              data-testid={dataTestId}
            />
            <DatePicker.Trigger 
              className="p-1.5 rounded-lg lg:hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              data-testid={dataTestId ? `${dataTestId}-trigger` : undefined}
            >
              <Calendar size={16} className="text-gray-600 dark:text-gray-300" />
            </DatePicker.Trigger>
            <DatePicker.ClearTrigger 
              className="p-1.5 rounded-lg text-red-500 lg:hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors duration-200"
              data-testid={dataTestId ? `${dataTestId}-clear` : undefined}
            >
              <X size={14} />
            </DatePicker.ClearTrigger>
          </DatePicker.Control>

          {/* Calendar Popup */}
          <Portal>
            <DatePicker.Positioner>
              <DatePicker.Content className="mt-2 w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-4 z-50">
                
                {/* Year + Month Select */}
                <div className="flex gap-2 mb-4">
                  <DatePicker.YearSelect className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none" />
                  <DatePicker.MonthSelect className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                {/* Day View */}
                <DatePicker.View view="day">
                  <DatePicker.Context>
                    {(datePicker) => (
                      <>
                        <DatePicker.ViewControl className="flex justify-between items-center mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <DatePicker.PrevTrigger className="p-2 rounded-lg lg:hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                            <ChevronLeft size={18} />
                          </DatePicker.PrevTrigger>
                          <DatePicker.ViewTrigger className="cursor-pointer px-3 py-2 rounded-lg lg:hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold transition-colors duration-200">
                            <DatePicker.RangeText />
                          </DatePicker.ViewTrigger>
                          <DatePicker.NextTrigger className="p-2 rounded-lg lg:hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                            <ChevronRight size={18} />
                          </DatePicker.NextTrigger>
                        </DatePicker.ViewControl>

                        <DatePicker.Table className="w-full text-center text-sm">
                          <DatePicker.TableHead>
                            <DatePicker.TableRow>
                              {datePicker.weekDays.map((weekDay, id) => (
                                <DatePicker.TableHeader
                                  key={id}
                                  className="py-2 text-xs font-medium text-gray-500 dark:text-gray-400"
                                >
                                  {weekDay.short}
                                </DatePicker.TableHeader>
                              ))}
                            </DatePicker.TableRow>
                          </DatePicker.TableHead>
                          <DatePicker.TableBody>
                            {datePicker.weeks.map((week, id) => (
                              <DatePicker.TableRow key={id}>
                                {week.map((day, id) => (
                                  <DatePicker.TableCell key={id} value={day}>
                                    <DatePicker.TableCellTrigger
                                      className="w-10 h-10 flex items-center justify-center rounded-lg lg:hover:bg-blue-100 dark:hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 transition-all duration-200 data-[selected]:bg-blue-600 data-[selected]:text-white data-[today]:bg-gray-100 data-[today]:dark:bg-gray-700 data-[today]:font-semibold"
                                    >
                                      {day.day}
                                    </DatePicker.TableCellTrigger>
                                  </DatePicker.TableCell>
                                ))}
                              </DatePicker.TableRow>
                            ))}
                          </DatePicker.TableBody>
                        </DatePicker.Table>
                      </>
                    )}
                  </DatePicker.Context>
                </DatePicker.View>

                {/* Month View */}
                <DatePicker.View view="month">
                  <DatePicker.Context>
                    {(datePicker) => (
                      <>
                        <DatePicker.ViewControl className="flex justify-between items-center mb-4">
                          <DatePicker.PrevTrigger className="p-2 rounded-lg lg:hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                            <ChevronLeft size={18} />
                          </DatePicker.PrevTrigger>
                          <DatePicker.ViewTrigger className="cursor-pointer px-3 py-2 rounded-lg lg:hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold transition-colors duration-200">
                            <DatePicker.RangeText />
                          </DatePicker.ViewTrigger>
                          <DatePicker.NextTrigger className="p-2 rounded-lg lg:hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                            <ChevronRight size={18} />
                          </DatePicker.NextTrigger>
                        </DatePicker.ViewControl>
                        <DatePicker.Table className="w-full text-sm">
                          <DatePicker.TableBody>
                            {datePicker.getMonthsGrid({ columns: 4, format: "short" }).map((months, id) => (
                              <DatePicker.TableRow key={id}>
                                {months.map((month, id) => (
                                  <DatePicker.TableCell key={id} value={month.value}>
                                    <DatePicker.TableCellTrigger className="px-3 py-2 rounded-lg lg:hover:bg-blue-100 dark:hover:bg-blue-800 data-[selected]:bg-blue-600 data-[selected]:text-white transition-all duration-200">
                                      {month.label}
                                    </DatePicker.TableCellTrigger>
                                  </DatePicker.TableCell>
                                ))}
                              </DatePicker.TableRow>
                            ))}
                          </DatePicker.TableBody>
                        </DatePicker.Table>
                      </>
                    )}
                  </DatePicker.Context>
                </DatePicker.View>

                {/* Year View */}
                <DatePicker.View view="year">
                  <DatePicker.Context>
                    {(datePicker) => (
                      <>
                        <DatePicker.ViewControl className="flex justify-between items-center mb-4">
                          <DatePicker.PrevTrigger className="p-2 rounded-lg lg:hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                            <ChevronLeft size={18} />
                          </DatePicker.PrevTrigger>
                          <DatePicker.ViewTrigger className="cursor-pointer px-3 py-2 rounded-lg lg:hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold transition-colors duration-200">
                            <DatePicker.RangeText />
                          </DatePicker.ViewTrigger>
                          <DatePicker.NextTrigger className="p-2 rounded-lg lg:hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                            <ChevronRight size={18} />
                          </DatePicker.NextTrigger>
                        </DatePicker.ViewControl>
                        <DatePicker.Table className="w-full text-sm">
                          <DatePicker.TableBody>
                            {datePicker.getYearsGrid({ columns: 4 }).map((years, id) => (
                              <DatePicker.TableRow key={id}>
                                {years.map((year, id) => (
                                  <DatePicker.TableCell key={id} value={year.value}>
                                    <DatePicker.TableCellTrigger className="px-3 py-2 rounded-lg lg:hover:bg-blue-100 dark:hover:bg-blue-800 data-[selected]:bg-blue-600 data-[selected]:text-white transition-all duration-200">
                                      {year.label}
                                    </DatePicker.TableCellTrigger>
                                  </DatePicker.TableCell>
                                ))}
                              </DatePicker.TableRow>
                            ))}
                          </DatePicker.TableBody>
                        </DatePicker.Table>
                      </>
                    )}
                  </DatePicker.Context>
                </DatePicker.View>
              </DatePicker.Content>
            </DatePicker.Positioner>
          </Portal>
        </DatePicker.Root>
      </div>
    )
  }
)

ModernDatePicker.displayName = "ModernDatePicker"