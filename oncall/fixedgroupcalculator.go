package oncall

import (
	"github.com/target/goalert/schedule"
)

type FixedGroupCalculator struct {
	*TimeIterator

	*ActiveCalculator
	*UserCalculator
}

func (t *TimeIterator) NewFixedGroupCalculator(groups []schedule.FixedShiftGroup) *FixedGroupCalculator {
	fg := &FixedGroupCalculator{
		TimeIterator:     t,
		ActiveCalculator: t.NewActiveCalculator(),
		UserCalculator:   t.NewUserCalculator(),
	}

	for _, g := range groups {
		fg.ActiveCalculator.SetSpan(g.Start, g.End)

		for _, s := range g.Shifts {
			fg.UserCalculator.SetSpan(s.Start, s.End, s.UserID)
		}
	}
	fg.ActiveCalculator.Init()
	fg.UserCalculator.Init()

	return fg
}